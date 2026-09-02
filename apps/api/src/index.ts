import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "@gokaido/database";
import authRouter from "./routes/auth.js";
import productRouter from "./routes/product.js";
import cartRouter from "./routes/cart.js";
import addressRouter from "./routes/address.js";
import couponRouter from "./routes/coupon.js";
import feedRouter from "./routes/feed.js";
import userRouter from "./routes/user.js";

const app = express();

// The storefront and admin portal are separate origins from this API (even
// in dev — different ports), so every real request is cross-origin.
const allowedOrigins = (
  process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3002"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Trust proxy — needed for rate limiter to read real IP behind load balancer
app.set("trust proxy", 1);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/feeds", feedRouter);
app.use("/api/users", userRouter);

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
