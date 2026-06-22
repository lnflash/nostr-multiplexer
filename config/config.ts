type Env = 'staging' | 'production' | 'test';

type Config = {
  env: Env;
  GRAPHQL_URL: string;
  PORT: number;
  // How many proxy hops to trust for client-IP derivation (used by the rate
  // limiter). Secure default is `false` — do NOT trust X-Forwarded-For. In a
  // proxied deployment set TRUST_PROXY to the number of proxies in front of the
  // app (e.g. 1), so req.ip reflects the real client and cannot be spoofed.
  TRUST_PROXY: boolean | number | string;
};

const env = (process.env.NODE_ENV as Env) || 'production';

// Fail fast: a missing GRAPHQL_URL must crash on boot, not surface as a 502 on
// the first request (which makes a misconfigured deploy look healthy).
const GRAPHQL_URL = process.env.GRAPHQL_URL;
if (!GRAPHQL_URL) {
  throw new Error(
    `[config] GRAPHQL_URL is required but is not set (NODE_ENV=${env}). ` +
      'Set GRAPHQL_URL in the environment before starting the service.',
  );
}

const PORT = Number(process.env.PORT) || 4000;

const parseTrustProxy = (
  raw: string | undefined,
): boolean | number | string => {
  if (raw === undefined || raw === '') {
    return false;
  }
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  const n = Number(raw);
  return Number.isNaN(n) ? raw : n;
};

const config: Config = {
  env,
  GRAPHQL_URL,
  PORT,
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
};

export default config;
