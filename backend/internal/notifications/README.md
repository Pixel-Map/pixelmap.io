# Discord tile updates

The standalone Go worker restores the original PixelMap bot's green embeds,
tile thumbnails and playful compliments. It polls `data_histories` independently
of the indexer, so Discord failures do not interrupt indexing or S3 publishing.

## Run on raccoon

Set `DISCORD_TOKEN` and `DISCORD_CHANNEL_ID` in the ignored `.env.raccoon`.
The existing channel is `880262613664137270`. The bot needs View Channel,
Send Messages and Embed Links there. No gateway connection or privileged
message-content intent is needed to send updates.

```sh
docker compose --env-file .env.raccoon -f docker-compose.raccoon.yml up -d --build --no-deps discord-bot
docker logs --since 10m pixelmap-raccoon-discord-bot
```

The service runs as an unprivileged user and receives only its database URL,
bot token and channel ID. It does not mount the image cache or receive AWS keys.

## Delivery behavior

- On first startup per channel, the cursor is initialized to the latest history
  ID. Old history is not broadcast. Subsequent restarts resume pending updates.
- A separate cursor in `current_state`, named
  `DISCORD_LAST_DATA_HISTORY_ID_<channel ID>`, is advanced only after delivery
  succeeds (or an empty image is skipped, matching the old bot).
- Each notification uses the event's author, URL, timestamp and immutable
  `/tile/block.png` image. It waits for that image to return HTTP 200 publicly.
- A database row lock prevents concurrent workers from sending the same event.
  A stable Discord nonce deduplicates recent retries after an uncertain send.
  Discord's nonce window is limited; a crash after a successful send but before
  the database commit can still duplicate a message after a prolonged outage.
- At most one event is processed every five seconds. Failed requests preserve
  the cursor; 429 responses honor Discord's retry delay, while authentication,
  permissions and invalid-payload errors wait five minutes between attempts.
- Mentions are disabled. Embed lengths are bounded, links are validated, and
  logs contain event/tile/message IDs without tokens or response bodies.

Look for `Discord notifier ready` and `Discord tile update processed` in logs.
`Discord notification deferred; cursor preserved` indicates a retryable backlog;
check the reported HTTP status for missing images or Discord permissions.
The Discord account may appear offline: this worker sends over REST rather
than maintaining a gateway presence.

For an intentional limited backfill, stop the worker and explicitly set its
cursor to the history ID immediately before the first desired event. Never
reuse the old NestJS row-count cursor or reset this cursor to zero in production.

## Verification

```sh
go test ./internal/notifications
# Point only at a disposable Postgres database; tests create/drop isolated schemas.
NOTIFICATIONS_TEST_DATABASE_URL='postgres://postgres:test@localhost:55439/postgres?sslmode=disable' \
  go test -race ./internal/notifications
```

The tests cover public-image gating, failure/retry cursor preservation, restart
behavior, concurrent workers, empty images, message limits, disabled mentions,
rate limits, receipts and credential-safe redirect handling.

API references: [Create Message](https://docs.discord.com/developers/resources/message#create-message)
and [Rate Limits](https://docs.discord.com/developers/topics/rate-limits).
