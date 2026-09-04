# nostr-multiplexer — Audit Report

**Branch:** `fix/harden-nip05-endpoint` (PR #10 → `main`)
**Date:** 2026-06-22
**Service:** Express + TypeScript public **NIP-05 → GraphQL proxy** (`/.well-known/nostr.json?name=`)
**Method:** Four parallel deep-dives — security, architecture/code-quality, dependencies/Docker/CI, tests. Build + tests run locally.

> This audit reviewed the hardening branch against `main`. The highest-value findings were then **fixed in this same branch** — see "Fixes applied in this PR" below. Remaining items are tracked as follow-ups.

## Overall verdict

The hardening branch was already a **substantial, genuine improvement** over `main` — it fixed a real error-message leak, added strict input validation, parameterized the GraphQL query, added upstream timeouts, upgraded production dependencies to advisory-free versions, and shipped a non-root multi-stage Docker image. Its one critical shortfall was that the **rate limiting it was built to add was bypassable** (and per-process only). This PR closes that gap and the other high-value items.

## ✅ Already correct on the branch (verified)

- **Error leak fixed** — `main` returned `err.message`; now logs server-side, returns generic `502` (upstream) vs `404` (not found).
- **Input validation** — `^[a-z0-9_.-]{1,64}$` + length cap closes injection / ReDoS / prototype-pollution; GraphQL query is **parameterized** (`$username: Username!`).
- **Outbound hardening** — axios `timeout: 3000` + `maxRedirects: 0`; single config-fixed upstream (no SSRF on the live path).
- **Dependencies** — prod deps upgraded to clean versions; `npm audit --omit=dev`: **0 vulns**; lockfile frozen; no postinstall/git deps; removed the `npm` devDep.
- **Docker** — multi-stage, non-root (`USER nodejs`), prod-only deps, no secrets baked in.
- **CORS** — `*` without credentials on a public read-only endpoint is correct.
- **Secrets** — none committed.

## 🔧 Fixes applied in this PR

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 1 | **Rate limiter bypassable** — keyed on raw `X-Forwarded-For` with no `trust proxy` | **High** | Controller now uses `req.ip`; `app.set('trust proxy', config.TRUST_PROXY)` driven by a new `TRUST_PROXY` env (secure default: don't trust XFF). Added a regression test proving spoofed `X-Forwarded-For` no longer creates new buckets. |
| 2 | **No security headers**, `X-Powered-By` exposed | Medium | Added `helmet()` + `app.disable('x-powered-by')`. |
| 3 | **No boot-time config validation** — missing `GRAPHQL_URL` surfaced as a runtime 502 | Medium | `config.ts` now fails fast on boot if `GRAPHQL_URL` is unset; `/ready` and `PORT` read from `config`, not `process.env`. Fixed dotenv load ordering (`import 'dotenv/config'` first). |
| 4 | **Dead "multiplexer" relay code ships in the image** (`src/scripts/*`) | High (surface) | Excluded `src/scripts` (and `tests`) from the build via `tsconfig` `include`/`exclude`; verified a clean `dist/` no longer contains them. |
| 5 | **CI audit gate is false confidence** (prod-deps only; misses dev advisories) | High (process) | Kept the prod-dep gate; added a report-only full audit so dev advisories (incl. the critical vitest/esbuild chain) are surfaced. |
| 6 | **`.env.sample` stale** (Redis vars; missing `GRAPHQL_URL`/`PORT`) | Low | Rewritten to the real variables (`PORT`, `GRAPHQL_URL`, `NODE_ENV`, `TRUST_PROXY`). |
| 7 | No global error handler / 404 / `unhandledRejection` guard | Medium | Added terminal error middleware, 404 fallthrough, and an `unhandledRejection` logger in `index.ts`. |
| 8 | `express.json()` mounted on a GET-only API | Low | Removed. |
| 9 | No `HEALTHCHECK`; loose tooling | Low | Added Docker `HEALTHCHECK` against `/ready`; added `.nvmrc` (20) + `engines`; bumped `tsconfig` `target` to `es2022`. |
| 10 | Fragile, order-dependent rate-limit test | Medium | Added a `resetStateForTests()` helper called in `beforeEach`; rewrote the test to assert the 60-request boundary precisely. |

All changes verified: `yarn build` clean, `yarn test` → **9/9 passing**.

## 📋 Remaining follow-ups (not in this PR)

- **Rate limiter + cache are in-process only** *(Medium→High)* — across multiple replicas the 60/min limit becomes 60×N and resets on redeploy. Move to a shared store (Redis) for horizontal scaling, or document single-instance as a constraint. `express-rate-limit` + `rate-limit-redis` is the standard path. *(This PR closes the spoofing hole but not the multi-replica coordination gap.)*
- **devDependency vulnerabilities** *(Medium)* — 1 critical / 4 high / 4 moderate in the `vitest`/`esbuild` and `nodemon` chains (dev-only, not shipped). Bump `vitest` to 4.x and `nodemon` to latest 3.x; deferred here because the `vitest` 2→4 major jump risks the test config and should be its own change. CI now surfaces these.
- **Docker base image not digest-pinned** *(Medium)* — `node:20-alpine` is a moving tag; pin by `@sha256:…` for reproducible builds.
- **Repository (`queries.ts`) has no direct tests** *(Medium)* — the timeout / `maxRedirects` / `validateStatus` / optional-chaining hardening is entirely mocked away in the suite.
- **Negative lookups aren't cached** despite the "reduce abuse" comment — repeated misses always hit upstream (bounded only by the rate limiter).
- **Minor:** `nip19.decode(...).data as string` should assert `type === 'npub'`; `queries.ts` uses `catch (error: any)` (→ `unknown`); centralize the duplicated 64-char limit; add ESLint/Prettier; adopt a structured logger.

## Branch hygiene note

The repo's actual behavior is a single-purpose NIP-05 → GraphQL proxy; the `src/scripts/*` relay-fan-out code (the "multiplexer" the repo is named for) is unused dev tooling. It is now excluded from the build but left in the tree — consider deleting it or moving it to a `tools/` directory.

---

*Audit generated with Claude Code.*
