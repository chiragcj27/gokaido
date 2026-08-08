import "dotenv/config";
import express from "express";
import { connectDB } from "@gokaido/database";
import authRouter from "./routes/auth.js";

const app = express();

app.use(express.json());

// Trust proxy — needed for rate limiter to read real IP behind load balancer
app.set("trust proxy", 1);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

const port = Number(process.env.PORT) || 3001;

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

connectDB(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((err: unknown) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
