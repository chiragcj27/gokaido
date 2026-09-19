import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import { connectDB } from "@gokaido/database";
import authRouter from "./routes/auth.js";
import productRouter from "./routes/product.js";
import categoryRouter from "./routes/category.js";
import subcategoryRouter from "./routes/subcategory.js";
import colorRouter from "./routes/color.js";
import collectionRouter from "./routes/collection.js";
import cartRouter from "./routes/cart.js";
import addressRouter from "./routes/address.js";
import couponRouter from "./routes/coupon.js";
import feedRouter from "./routes/feed.js";
import userRouter from "./routes/user.js";
import orderRouter from "./routes/order.js";
import adminOrderRouter from "./routes/adminOrder.js";
import reviewRouter from "./routes/review.js";
import adminReviewRouter from "./routes/adminReview.js";
import uploadRouter from "./routes/upload.js";
import assetRouter from "./routes/asset.js";

const app: Express = express();

// The storefront and admin portal are separate origins from this API (even
// in dev — different ports), so every real request is cross-origin.
const allowedOrigins = (
  process.env.CORS_ORIGINS ??
    "http://localhost:3000,http://localhost:3002,https://gokaido-admin.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Serverless (Vercel) never runs the boot-time connect below, so connect on
// demand; connectDB is a no-op once connected.
app.use(async (_req, res, next) => {
  if (!process.env.VERCEL) return next();
  try {
    await connectDB(process.env.MONGODB_URI ?? "");
    next();
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    res.status(503).json({ error: "Database unavailable" });
  }
});

// Trust proxy — needed for rate limiter to read real IP behind load balancer
app.set("trust proxy", 1);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/subcategories", subcategoryRouter);
app.use("/api/colors", colorRouter);
app.use("/api/collections", collectionRouter);
app.use("/api/cart", cartRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/feeds", feedRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin/reviews", adminReviewRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/assets", assetRouter);

const mongoUri = process.env.MONGODB_URI;

export default app;

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3001;

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
}
