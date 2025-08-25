import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/users";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;

app.use(express.json()); // Parse JSON request bodies

app.use("/", userRoutes);

// app.post("/register", userController.registerUser);

app.get("/ping", (req: Request, res: Response) => {
  res.send("pong");
});
app.listen(port, async () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
