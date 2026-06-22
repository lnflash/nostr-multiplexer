import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock the GraphQL queries module before importing the controller
const mockGetPubkeyByName = vi.fn();

vi.mock('../src/repository/queries', () => ({
  getPubkeyByName: (...args: unknown[]) => mockGetPubkeyByName(...args),
}));

// Mock config
vi.mock('../config/config', () => ({
  default: {GRAPHQL_URL: 'http://test-graphql:4000/graphql'},
}));

import {getNip05} from '../src/controllers/NIP05Controller';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/.well-known/nostr.json', getNip05);
  return app;
};

// Helper to generate a valid npub that decodes to a hex
// We mock nip19.decode to avoid needing real Nostr keys
vi.mock('nostr-tools', () => ({
  nip19: {
    decode: (npub: string) => ({data: 'a'.repeat(64)}),
  },
}));

describe('NIP-05 Controller', () => {
  beforeEach(() => {
    mockGetPubkeyByName.mockReset();
    vi.useRealTimers();
  });

  it('returns 400 when name is missing', async () => {
    const app = createApp();
    const res = await request(app).get('/.well-known/nostr.json');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid');
  });

  it('returns 400 for invalid name characters', async () => {
    const app = createApp();
    const res = await request(app).get('/.well-known/nostr.json?name=<script>');

    expect(res.status).toBe(400);
  });

  it('returns 400 for oversized names', async () => {
    const app = createApp();
    const longName = 'a'.repeat(65);
    const res = await request(app).get(
      `/.well-known/nostr.json?name=${longName}`,
    );

    expect(res.status).toBe(400);
  });

  it('returns 404 when user is not found', async () => {
    mockGetPubkeyByName.mockResolvedValueOnce(null);
    const app = createApp();
    const res = await request(app).get('/.well-known/nostr.json?name=nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('User not found');
    expect(res.headers['cache-control']).toContain('max-age=10');
  });

  it('returns NIP-05 JSON when user is found', async () => {
    mockGetPubkeyByName.mockResolvedValueOnce('npub1test123');
    const app = createApp();
    const res = await request(app).get('/.well-known/nostr.json?name=alice');

    expect(res.status).toBe(200);
    expect(res.body.names).toHaveProperty('alice');
    expect(res.body.names.alice).toBe('a'.repeat(64));
    expect(res.headers['cache-control']).toContain('max-age=60');
  });

  it('serves from cache on repeated lookups', async () => {
    mockGetPubkeyByName.mockResolvedValueOnce('npub1cached');
    const app = createApp();

    // First request hits upstream
    const res1 = await request(app).get('/.well-known/nostr.json?name=bob');
    expect(res1.status).toBe(200);
    expect(mockGetPubkeyByName).toHaveBeenCalledTimes(1);

    // Second request should be cached
    const res2 = await request(app).get('/.well-known/nostr.json?name=bob');
    expect(res2.status).toBe(200);
    expect(mockGetPubkeyByName).toHaveBeenCalledTimes(1); // still 1
  });

  it('returns 502 when upstream fails', async () => {
    mockGetPubkeyByName.mockRejectedValueOnce(new Error('GraphQL down'));
    const app = createApp();
    const res = await request(app).get('/.well-known/nostr.json?name=charlie');

    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Upstream lookup failed');
    // Should not leak internal error details
    expect(res.body.error).not.toContain('GraphQL down');
  });

  it('enforces rate limiting after threshold', async () => {
    mockGetPubkeyByName.mockResolvedValue(null);
    const app = createApp();

    // Send requests up to the limit (60 per minute)
    let lastStatus = 200;

    for (let i = 0; i < 62; i++) {
      const res = await request(app).get(
        `/.well-known/nostr.json?name=user${i}`,
      );
      lastStatus = res.status;
    }

    // The 62nd should be rate limited (61st and 62nd)
    expect(lastStatus).toBe(429);
  });
});
