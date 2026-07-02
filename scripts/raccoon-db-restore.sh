#!/usr/bin/env bash
set -euo pipefail

# One-shot migration of the pixelmap Postgres DB from the EC2 box's `postgres`
# Docker container into raccoon's `pixelmap-raccoon-db` container.
#
# The two hosts can't reach each other directly (the EC2 box is SG-locked and
# raccoon sits behind .localdomain), so the dump is piped box -> this
# workstation -> raccoon. The DB is tiny (~4.5 MB custom-format), so this is
# fast and a staging file on the workstation is fine.
#
# This script temporarily opens port 22 on the box's security group for THIS
# machine's public IP and revokes it on exit (trap), mirroring how we sized the
# box. It needs AWS creds in the environment (admin) to do so.
#
# Prereqs:
#   - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY exported (admin, to edit the SG)
#   - SSH key to the box (default ~/.ssh/neo-pixelmap.pem)
#   - raccoon reachable over SSH (default host alias below)
#   - The raccoon stack's postgres container is already up:
#       docker compose --env-file .env.raccoon -f docker-compose.raccoon.yml up -d postgres
#   - The indexer is NOT running yet (so nothing holds the DB open).

: "${AWS_ACCESS_KEY_ID:?export AWS admin creds first}"
: "${AWS_SECRET_ACCESS_KEY:?export AWS admin creds first}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

BOX_INSTANCE_ID="${BOX_INSTANCE_ID:-i-09512b4e5a8e06bb8}"
BOX_KEY="${BOX_KEY:-$HOME/.ssh/neo-pixelmap.pem}"
BOX_USER="${BOX_USER:-ec2-user}"
BOX_PG_CONTAINER="${BOX_PG_CONTAINER:-postgres}"
BOX_PG_DB="${BOX_PG_DB:-pixelmap}"

RACCOON_SSH="${RACCOON_SSH:-raccoon@raccoons-Pro.localdomain}"
RACCOON_DB_CONTAINER="${RACCOON_DB_CONTAINER:-pixelmap-raccoon-db}"
# Non-interactive SSH to raccoon has a minimal PATH; OrbStack's docker lives in
# ~/.orbstack/bin. $HOME stays literal (single-quoted) so it expands on raccoon.
REMOTE_PATH='export PATH=$HOME/.orbstack/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin;'

STAGE="$(mktemp -t pixelmap-db-XXXXXX.dump)"
cleanup() {
  [ -n "${SG_OPENED:-}" ] && aws ec2 revoke-security-group-ingress \
    --group-id "$SG" --protocol tcp --port 22 --cidr "${MYIP}/32" >/dev/null 2>&1 \
    && echo "🔒 Closed temporary SSH rule."
  rm -f "$STAGE"
}
trap cleanup EXIT

echo "==> Opening temporary SSH access to the box..."
MYIP="$(curl -s https://checkip.amazonaws.com | tr -d '\n')"
SG="$(aws ec2 describe-instances --instance-ids "$BOX_INSTANCE_ID" \
  --query 'Reservations[].Instances[].SecurityGroups[].GroupId' --output text)"
aws ec2 authorize-security-group-ingress --group-id "$SG" --protocol tcp --port 22 \
  --cidr "${MYIP}/32" >/dev/null 2>&1 && SG_OPENED=1
echo "    SG $SG open for ${MYIP}/32"

echo "==> Dumping pixelmap DB from the box container (custom format)..."
ssh -i "$BOX_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=15 \
  "${BOX_USER}@$(aws ec2 describe-instances --instance-ids "$BOX_INSTANCE_ID" \
    --query 'Reservations[].Instances[].PublicIpAddress' --output text)" \
  "sudo docker exec ${BOX_PG_CONTAINER} pg_dump -U postgres --no-owner --no-privileges -Fc ${BOX_PG_DB}" \
  > "$STAGE"
echo "    Dump size: $(du -h "$STAGE" | cut -f1)"

echo "==> Restoring into raccoon's ${RACCOON_DB_CONTAINER} (drop + recreate pixelmap)..."
# Recreate the DB cleanly, then restore. Runs on raccoon against its container.
ssh "$RACCOON_SSH" "${REMOTE_PATH} docker exec -i ${RACCOON_DB_CONTAINER} psql -U postgres -v ON_ERROR_STOP=1 -c 'DROP DATABASE IF EXISTS pixelmap;' -c 'CREATE DATABASE pixelmap;'"
ssh "$RACCOON_SSH" "${REMOTE_PATH} docker exec -i ${RACCOON_DB_CONTAINER} pg_restore -U postgres --no-owner --no-privileges -d pixelmap" < "$STAGE"

echo "✅ pixelmap DB restored onto raccoon."
echo "   Verify: ssh $RACCOON_SSH \"docker exec ${RACCOON_DB_CONTAINER} psql -U postgres -d pixelmap -c 'SELECT count(*) FROM tiles;'\""
