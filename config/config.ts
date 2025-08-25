type Env = "staging" | "production" | "test";

const configData = {
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
const env = (process.env.NODE_ENV as Env) || "test";
const config = configData[env];

if (!config) {
  throw new Error(`No configuration found for NODE_ENV=${env}`);
}

export default config;
