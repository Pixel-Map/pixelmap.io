# Update reliability

Chain ingestion fetches every page from both contracts and the Transfer log
source before advancing its block checkpoint. HTTP errors, malformed pages,
and stalled pagination fail the batch. Combined events are ordered by block,
transaction, and log position. Duplicate source records are ignored; distinct
logs from the same transaction are preserved.

The renderer retains its history checkpoint until PNG generation, metadata,
the full map, and publication all succeed. Files are replaced atomically.
Upload failures remain retryable without another tile update. Successful
uploads are recorded in a private `.s3-manifest-<bucket>.json` cache file so
restarts do not upload the entire cache again. Remove that manifest to force
a complete re-upload when restoring a bucket or repairing remote objects.

Invalid artwork on chain is published as a transparent tile instead of
retaining the previous image. Discord sends a text notification immediately
for invalid artwork; valid images receive up to one hour to become available
before a text fallback. The timer survives restarts. Send failures preserve
the cursor and continue retrying. Fallback events leave an audit record under
`DISCORD_IMAGE_FALLBACK_<channel>_<history-id>` in `current_state` and emit an
error log with the tile and history IDs.

`lastUpdated` comes from the latest available data, ownership, or wrapping
history. A tile with no known history uses `null`. Deployment must regenerate
existing metadata to replace previously published hardcoded dates. Use the
existing `regenerate-tiles` command in a checkout with the correct database
and cache configuration, then `sync-s3` to publish those files.

These changes prevent future silent skips. They do not automatically replay
old block ranges or prove that historical ingestion was complete. Reconcile
any suspected historical gaps before choosing a bounded replay. Do not reset
the Discord cursor as part of ingestion recovery.

CI runs real PostgreSQL tests for queue recovery and chain ordering, unit
failure tests, race checks, frontend tests/typechecking/lint, and a static
production build. Frontend dependencies now use ethers v6, removing elliptic;
wallet signing remains in the injected wallet.

## Atomic ingestion and publication recovery

The indexer commits each fetched block range in one Postgres transaction: history,
current tile state, the ingestion checkpoint, and `PUBLICATION_TILE_<id>` markers.
A failed field validation or database write rolls back the complete range. Purchase
receipts are idempotent on replay. Markers include non-image changes such as
ownership and wrapping; they are cleared only after publication succeeds.

One indexer owns ingestion and the cache. Its publication mutex prevents a render
from mixing database states across an ingestion commit. Do not run maintenance
writers or a second indexer against the same cache concurrently.

## Historical image URLs

New historical filenames include the block number and SHA-256 of the transaction
identity. Two updates to one tile in the same block retain distinct PNGs. The old
`/<tile>/<block>.png` and `/<tile>/latest.png` aliases remain available and point to
the final edit in chain order. Existing metadata keeps legacy links until the
unique artifact has been materialized locally.

Before starting the new Discord worker against an existing database, stop the
indexer and bot and run these commands in the maintenance build image, with the
usual private dotenv file, database network, and cache volume mounted:

```sh
go run ./cmd/regenerate-tiles
go run ./cmd/sync-s3
```

The regeneration command materializes historical artifacts before writing their
new metadata URLs. Sync must succeed before restarting the workers. This backfills
files only: it does not rewind ingestion or Discord delivery cursors or post a
historical replay. Save the database and old images for rollback as usual.

## Incremental S3 publication

The bucket-specific hash manifest is retained. A companion stat manifest records
file size and nanosecond modification time, so unchanged files are not rehashed
after a restart. Changed or new files form the pending upload set. Four concurrent
workers publish images first, per-tile JSON next, and `tiledata.json` last. Failure
in one phase prevents later phases; successful objects remain acknowledged for
retry. Replacing an artifact during an upload leaves it pending.

Artifacts must be replaced normally or atomically; external tools that deliberately
preserve both size and modification time can evade stat-based change discovery.
For a full verification, stop the indexer and remove only the private
`.s3-stats-<bucket>.json` before running sync; keep the hash manifest. This forces
hash verification without re-uploading identical content. Hidden files never upload.

## Freshness and shutdown

Both runtime images define Docker health checks. The indexer requires successful
ingestion and publication cycles within ten minutes; the Discord worker requires
a successful queue step within ten minutes, including an empty-queue database
check. Container startup gets a two-minute grace period. Failures become visible
as `unhealthy` in `docker compose ps` and `docker inspect`; health checks do not
send Discord messages or automatically restart an unhealthy process. Monitoring
can alert on this status.

The indexer and bot handle SIGTERM. The renderer uses the same cancellable context
as ingestion, and the indexer waits for it before exiting. Compose allows 45 seconds
for shutdown; pending database markers and upload manifests support the next start.
