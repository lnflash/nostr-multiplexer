import redisClient from "../redis";
import {} from "redis";

const registerUser = (userId: string): Promise<{ message: string }> => {
  return new Promise((resolve, reject) => {
    if (!userId) {
      reject(new Error("UserId is required"));
    }

    redisClient.sAdd("registeredUserIds", userId);
    resolve({ message: "added" });
  });
};

export default {
  registerUser,
};
