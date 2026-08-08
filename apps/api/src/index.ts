import express from "express";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Gokaido API" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
