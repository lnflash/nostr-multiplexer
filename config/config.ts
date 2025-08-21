import configData from "./config.json";

type Env = "staging" | "production" | "test";

const env = (process.env.NODE_ENV as Env) || "test";
const config = configData[env];

if (!config) {
  throw new Error(`No configuration found for NODE_ENV=${env}`);
}

export default config;
