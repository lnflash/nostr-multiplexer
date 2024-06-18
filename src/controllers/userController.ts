import { Request, Response } from "express";
import userService from "../services/userService";

const registerUser = async (req: Request, res: Response) => {
  const { userId } = req.body;

  try {
    console.log("initiating request", userId);
    const result = await userService.registerUser(userId);
    console.log("Got result");
    res.status(200).json(result);
  } catch (error) {
    console.error("Error registering user: ", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};

export default {
  registerUser,
};
