type Env = 'staging' | 'production' | 'test';

type Config = {
  GRAPHQL_URL: string | undefined;
};

const configData: Record<Env, Config> = {
  staging: {
    GRAPHQL_URL: process.env.GRAPHQL_URL,
  },
  production: {
    GRAPHQL_URL: process.env.GRAPHQL_URL,
  },
  test: {
    GRAPHQL_URL: process.env.GRAPHQL_URL,
  },
};

const env = (process.env.NODE_ENV as Env) || 'production';
const config = configData[env];

if (!config) {
  throw new Error(`No configuration found for NODE_ENV=${env}`);
}

export default config;
