// src/index.ts
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import userController from "./controllers/userController";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;

app.use(express.json()); // Parse JSON request bodies

app.post("/register", userController.registerUser);

app.get("/", (req: Request, res: Response) => {
  res.send("Watchamacallit? I don't know");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
