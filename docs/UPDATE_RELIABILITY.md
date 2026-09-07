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
