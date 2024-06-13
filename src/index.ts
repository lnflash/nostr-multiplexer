// src/index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;

app.get("/", (req: Request, res: Response) => {
  res.send("Watchamacallit? I dont know");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
