import {Request, Response} from 'express';
import {getPubkeyByName} from '../repository/queries';
import {nip19} from 'nostr-tools';

// Conservative NIP-05 username validation: lowercase alphanumeric + _ . -
// Max 64 chars per NIP-05 spec
const VALID_NAME = /^[a-z0-9_.-]{1,64}$/;

// Short-Term cache to prevent abuse via repeated lookups
// TTL: 60 seconds, max 1000 entries
type CacheEntry = {hex: string; expires: number};
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 1000;
const cache = new Map<string, CacheEntry>();

const pruneCache = () => {
  if (cache.size <= CACHE_MAX) {
    return;
  }

  const now = Date.now();

  for (const [key, entry] of cache) {
    if (entry.expires <= now) {
      cache.delete(key);
    }
  }

  // If still over limit, evict oldest entries
  if (cache.size > CACHE_MAX) {
    const sorted = [...cache.entries()].sort(
      (a, b) => a[1].expires - b[1].expires,
    );
    const toRemove = cache.size - CACHE_MAX;

    for (let i = 0; i < toRemove; i++) {
      cache.delete(sorted[i][0]);
    }
  }
};

// Simple per-IP rate limiter using a sliding window
// Max 60 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const ipHits = new Map<string, number[]>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const hits = ipHits.get(ip) ?? [];
  const recent = hits.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    return false;
  }

  recent.push(now);
  ipHits.set(ip, recent);

  // Periodic cleanup of stale entries
  if (ipHits.size > 10_000) {
    for (const [key, times] of ipHits) {
      const valid = times.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

      if (valid.length === 0) {
        ipHits.delete(key);
      } else {
        ipHits.set(key, valid);
      }
    }
  }

  return true;
};

// Test-only: clear in-process rate-limit + cache state so suites are not
// order-dependent on shared module singletons.
export const resetStateForTests = () => {
  ipHits.clear();
  cache.clear();
};

export const getNip05 = async (req: Request, res: Response) => {
  // Rate limit check.
  // Use req.ip, which Express derives from the trusted-proxy chain
  // (app.set('trust proxy', ...)). Do NOT read X-Forwarded-For directly — that
  // header is client-controlled and trivially spoofed to bypass the limiter.
  const clientIp = req.ip ?? 'unknown';

  if (!checkRateLimit(clientIp)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({error: 'Too Many Requests'});
  }

  // Input validation
  const rawName = req.query.name;

  if (typeof rawName !== 'string' || !VALID_NAME.test(rawName)) {
    return res.status(400).json({error: 'Invalid name parameter'});
  }

  const name = rawName.toLowerCase();

  // Check cache
  const cached = cache.get(name);

  if (cached && cached.expires > Date.now()) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json({
      names: {[name]: cached.hex},
    });
  }

  try {
    const npub = await getPubkeyByName(name);

    if (npub) {
      const hex = nip19.decode(npub).data as string;

      // Cache the result
      pruneCache();
      cache.set(name, {hex, expires: Date.now() + CACHE_TTL_MS});

      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.json({
        names: {[name]: hex},
      });
    }

    // Not found — cache negative result briefly to reduce abuse
    res.setHeader('Cache-Control', 'public, max-age=10');
    return res.status(404).json({error: 'User not found'});
  } catch (err) {
    // Never leak internal error details to public callers
    console.error('NIP-05 lookup error for', name, err);
    return res.status(502).json({error: 'Upstream lookup failed'});
  }
};
