import dotenv from "dotenv";
const redis = require("redis");

dotenv.config();

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  },
});

console.log(
  "Redis client initialized",
  process.env.REDIS_HOST,
  process.env.REDIS_PORT
);

(async () => {
  // Connect to redis server
  await redisClient.connect();
})();

redisClient.on("connect", () => {
  console.log("Redis client connected");
});

redisClient.on("error", (err: any) => {
  console.error("Redis error: ", err);
});

export default redisClient;
