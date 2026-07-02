#!/usr/bin/env bash
set -euo pipefail

# One-shot seed of raccoon's pixelmap `cache` volume from the EC2 box's live
# cache dir (~355 MB / ~22k files of rendered tiles + metadata).
#
# WHY THIS MATTERS: the indexer only renders tiles that CHANGE going forward.
# The full history of latest.png / metadata / tiledata.json already lives in
# ./cache on the box (and in s3://pixelmap.art). If raccoon starts with an empty
# cache, tilemap.png would be re-stitched from missing tiles and the indexer
# would needlessly re-upload. Seeding the cache first avoids that.
#
# Piped box -> workstation -> raccoon (the hosts can't reach each other). The
# archive lands directly inside the named docker volume via a throwaway
# alpine container, so it works whether or not the indexer is running (best to
# run it BEFORE first starting the indexer).
#
# Same SG-open/close + prereqs as raccoon-db-restore.sh.

: "${AWS_ACCESS_KEY_ID:?export AWS admin creds first}"
: "${AWS_SECRET_ACCESS_KEY:?export AWS admin creds first}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

BOX_INSTANCE_ID="${BOX_INSTANCE_ID:-i-09512b4e5a8e06bb8}"
BOX_KEY="${BOX_KEY:-$HOME/.ssh/neo-pixelmap.pem}"
BOX_USER="${BOX_USER:-ec2-user}"
BOX_CACHE_DIR="${BOX_CACHE_DIR:-/root/pixelmap.io/backend/cache}"

RACCOON_SSH="${RACCOON_SSH:-raccoon@raccoons-Pro.localdomain}"
# docker names volumes <project>_<volume>; compose project is `pixelmap-raccoon`.
RACCOON_CACHE_VOLUME="${RACCOON_CACHE_VOLUME:-pixelmap-raccoon_pixelmap_cache}"
# Non-interactive SSH to raccoon has a minimal PATH; OrbStack's docker lives in
# ~/.orbstack/bin. $HOME stays literal (single-quoted) so it expands on raccoon.
REMOTE_PATH='export PATH=$HOME/.orbstack/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin;'

STAGE="$(mktemp -t pixelmap-cache-XXXXXX.tgz)"
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
BOX_IP="$(aws ec2 describe-instances --instance-ids "$BOX_INSTANCE_ID" \
  --query 'Reservations[].Instances[].PublicIpAddress' --output text)"
aws ec2 authorize-security-group-ingress --group-id "$SG" --protocol tcp --port 22 \
  --cidr "${MYIP}/32" >/dev/null 2>&1 && SG_OPENED=1
echo "    SG $SG open for ${MYIP}/32"

echo "==> Archiving cache from the box (${BOX_CACHE_DIR})..."
# -C into the dir and archive its CONTENTS (.), so extraction lands at the
# volume root (/app/cache/<N>/...), not /app/cache/cache/<N>/...
ssh -i "$BOX_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=15 \
  "${BOX_USER}@${BOX_IP}" "sudo tar czf - -C ${BOX_CACHE_DIR} ." > "$STAGE"
echo "    Archive size: $(du -h "$STAGE" | cut -f1)"

echo "==> Extracting into raccoon volume ${RACCOON_CACHE_VOLUME}..."
ssh "$RACCOON_SSH" "${REMOTE_PATH} docker run --rm -i -v ${RACCOON_CACHE_VOLUME}:/app/cache alpine \
  sh -c 'tar xzf - -C /app/cache'" < "$STAGE"

echo "✅ Cache seeded onto raccoon."
echo "   Verify: ssh $RACCOON_SSH \"docker run --rm -v ${RACCOON_CACHE_VOLUME}:/c alpine sh -c 'ls /c | wc -l; du -sh /c'\""
