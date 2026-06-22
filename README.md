# nostr-multiplexer

Nostr infrastructure service for the Flash platform. Provides NIP-05 identity lookups backed by the Flash GraphQL API.

Live on `flashapp.me` — serves `/.well-known/nostr.json` for all Flash users with `@flashapp.me` NIP-05 identifiers.

## Endpoints

### `GET /.well-known/nostr.json`

NIP-05 username-to-pubkey resolution.

**Query params:**
- `name` — username to look up (lowercase alphanumeric, max 64 chars)

**Response (200):**
```json
{
  "names": {
    "alice": "a1b2c3d4..."
  }
}
```

Sets `Cache-Control: public, max-age=60`.

**Response (404):** User not found.
**Response (400):** Invalid name parameter.
**Response (429):** Rate limited (60 req/min per IP). Includes `Retry-After: 60`.
**Response (502):** Upstream GraphQL failure.

### `GET /ping`

Process-level health check. Always returns `pong`.

### `GET /ready`

Readiness check. Returns 200 if `GRAPHQL_URL` is configured, 503 otherwise.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GRAPHQL_URL` | Yes | — | Flash GraphQL endpoint URL |
| `PORT` | No | `4000` | HTTP listen port |
| `NODE_ENV` | No | `production` | Environment selector |

## Local Development

```bash
# Install dependencies
yarn install

# Start dev server with hot reload
GRAPHQL_URL=https://api.test.flashapp.me/graphql yarn dev

# Or build and run
yarn build
yarn start
```

## Testing

```bash
yarn test          # Run once
yarn test:watch    # Watch mode
yarn build         # TypeScript compile check
yarn audit --groups dependencies --level high   # Security audit
```

## Docker

```bash
docker build -t nostr-multiplexer .
docker run -p 4000:4000 -e GRAPHQL_URL=https://api.flashapp.me/graphql nostr-multiplexer
```

The Docker image uses a multi-stage build, runs as a non-root user, and installs production dependencies only.

## Architecture

```
Client (Nostr wallet)
  → GET /.well-known/nostr.json?name=alice
  → Rate limit check (60 req/min per IP)
  → Input validation (NIP-05 username regex)
  → Cache check (60s TTL, 1000 entries max)
  → Flash GraphQL: npubByUsername(username)
  → nip19.decode(npub) → hex pubkey
  → NIP-05 JSON response
```

### Rate Limiting

- 60 requests per minute per client IP
- Sliding window counter
- Returns `429 Too Many Requests` with `Retry-After: 60`
- In-memory (resets on restart)

### Caching

- Successful lookups cached for 60 seconds
- Maximum 1000 entries with LRU eviction
- `Cache-Control: public, max-age=60` on success
- `Cache-Control: public, max-age=10` on 404

## Deployment

Deployed to the Flash k8s cluster via the Helm chart at `charts/charts/nostr/nostr-multiplexer/` in the [charts repo](https://github.com/lnflash/charts).

Image: `lnflash/nostr-multiplexer` (GitHub Container Registry).

## Relay Multiplexer Scripts

The `src/scripts/` directory contains experimental relay fetcher scripts that are **not wired into the HTTP service** and are **not production-tested**. See the [audit report](docs/audit) for details on their limitations.

## License

MIT
