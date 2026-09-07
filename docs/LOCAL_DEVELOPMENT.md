# Local development

Install Node 22, pnpm 10.23.0 and the Go version in `backend/go.mod`.
Run `pnpm install --frozen-lockfile`, then `pnpm --dir frontend dev` for the
frontend using public tile data.

For the complete local stack, copy `.env.local.example` to `.env.local`, fill
in your Etherscan key and Ethereum RPC URL, and run:

```sh
docker compose --env-file .env.local up --build
```

The website is at http://localhost:3000; generated JSON and PNG assets are at
http://localhost:3001. PostgreSQL is bound to localhost:15433. The schema loads
automatically on a new database volume. The Go backend is an outbound indexer,
not an HTTP server. This stack publishes only into its local cache volume.
It does not start the production Discord worker.
Change the `PIXELMAP_*_PORT` values in `.env.local` if those ports are occupied.

A new database replays chain history from genesis, so the map starts empty and
fills as ingestion progresses. To work with a complete map immediately, use
the frontend-only command above, or restore a database and matching cache
snapshot into the local volumes. Do not point this local indexer at production.

Run unit checks with `./run-tests.sh`. For database-backed Discord tests:

```sh
export TEST_DATABASE_URL='postgres://postgres:local-only@localhost:15433/pixelmap?sslmode=disable'
export NOTIFICATIONS_TEST_DATABASE_URL="$TEST_DATABASE_URL"
go -C backend test -race ./...
```

The tests create and drop isolated schemas. CI supplies its own disposable
PostgreSQL service and runs these tests, frontend typechecking/lint, and the
static production build.
