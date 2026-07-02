# PixelMap → raccoon migration runbook (Path A: indexer only)

Moves the **indexer** off the EC2 `t3a.small` onto raccoon (OrbStack). The
public site keeps working unchanged: `pixelmap.art` is still served by its
existing **S3 + CloudFront**, and the indexer just keeps publishing renders to
`s3://pixelmap.art` from raccoon instead of from EC2.

**What moves:** Postgres DB (~4.5 MB) + rendered `cache/` (~355 MB) + the Go
indexer.
**What does NOT change:** `pixelmap.art` DNS (Route53), CloudFront, the S3
bucket, the smart-contract `tokenURI`, the Netlify frontend, and (per "don't
rotate anything") all existing keys.

## Architecture reality (why it's this simple)
- The box's live process is the **Go indexer** (`main.go` → `StartContinuousIngestion`), run by hand. It is **not** an HTTP server — nothing is exposed inbound, so there is **no tunnel**.
- `pixelmap.service` (systemd) is **stale** (points at a long-dead RDS host + an old `bun` backend). Ignore it.
- The frontend and NFT metadata read hardcoded `https://pixelmap.art/...`. Keeping S3/CloudFront means none of those URLs change.

## Prerequisites (run from this workstation)
- AWS admin creds exported (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) — used only to briefly open the box's SSH SG; the scripts revoke it on exit.
- SSH key to the box: `~/.ssh/neo-pixelmap.pem`.
- raccoon reachable: `ssh raccoon@raccoons-Pro.localdomain`.
- Repo present on raccoon at `~/Documents/pixelmap.io` (clone it there).

## Steps

### 1. Configure secrets on raccoon
On raccoon, in the repo root:
```
cp .env.raccoon.example .env.raccoon
```
Fill `.env.raccoon` with the real values from the box
(`sudo cat /root/pixelmap.io/backend/.env`): `WEB3_URL`, `ETHERSCAN_API_KEY`,
`OPENSEA_API_KEY`, `DISCORD_TOKEN`, and the existing S3 `AWS_ACCESS_KEY_ID` /
`AWS_SECRET_ACCESS_KEY`. Set a local `POSTGRES_PASSWORD` and keep it identical
inside `DATABASE_URL`. Keep `SYNC_TO_AWS=true`.

### 2. Start ONLY Postgres on raccoon
```
docker compose --env-file .env.raccoon -f docker-compose.raccoon.yml up -d postgres
```
(Don't start the indexer yet — the DB restore needs an idle database.)

### 3. Restore the DB (workstation)
```
export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...
./scripts/raccoon-db-restore.sh
```
Pipes the box's `pg_dump` → raccoon's `pixelmap-raccoon-db`. Verify tile count
when it prints the check command.

### 4. Seed the rendered cache (workstation)
```
./scripts/raccoon-cache-sync.sh
```
Copies the box's `cache/` (~355 MB) into the `pixelmap_cache` volume so the
indexer doesn't re-render/re-upload and `tilemap.png` stitches correctly.

### 5. Stop the box's indexer, then start raccoon's
The indexer must run in only one place (both would double-write to S3 and race
the chain cursor). On the **box**:
```
sudo pkill -f '/root/pixelmap.io/backend/backend' || true
# (also make sure the stale unit stays off: sudo systemctl disable --now pixelmap.service)
```
On **raccoon**:
```
docker compose --env-file .env.raccoon -f docker-compose.raccoon.yml up -d --build
docker logs -f pixelmap-raccoon-indexer
```
Confirm it connects to Postgres, resumes from the last indexed block (not block
0), and — on the next on-chain tile change — renders + uploads to
`s3://pixelmap.art`.

### 6. Decommission the box
After a day of clean indexing + a confirmed S3 publish:
```
aws ec2 terminate-instances --instance-ids i-09512b4e5a8e06bb8
```
Then release its Elastic IP (if any) and delete the SG once nothing references
it. Leave the `pixelmap.art` / `pixelmap.io` / `pixelmap.dev` buckets and
CloudFront in place — they still serve the site.

## Rollback
If raccoon's indexer misbehaves, just restart the box's indexer
(`cd /root/pixelmap.io/backend && sudo ./backend`). The DB + cache on the box
are untouched by this migration until you terminate it in step 6, and the
blockchain is the ultimate source of truth.
