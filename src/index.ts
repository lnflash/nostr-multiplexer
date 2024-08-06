import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import dbPromise from "./db/db";
import userRoutes from "./routes/users";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;

app.use(express.json()); // Parse JSON request bodies

app.use("/", userRoutes);

// app.post("/register", userController.registerUser);

app.get("/", (req: Request, res: Response) => {
  res.send("Watchamacallit? I don't know");
});

app.listen(port, async () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  // Ensure schema is set up
  try {
    await dbPromise; // Ensure the database connection is established
    console.log("Database connection established.");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
});
