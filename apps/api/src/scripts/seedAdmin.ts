import "dotenv/config";
import { connectDB, disconnectDB, User } from "@gokaido/database";
import { hashPassword } from "../utils/password.js";

// Seeds (or updates the password of) an admin login. Override via env vars,
// e.g.: SEED_ADMIN_EMAIL=ops@gokaido.com SEED_ADMIN_PASSWORD=... SEED_ADMIN_ROLE=superadmin pnpm seed:admin
const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@gmail.com").toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD ?? "admin@123";
const name = process.env.SEED_ADMIN_NAME ?? "Admin";
const role = process.env.SEED_ADMIN_ROLE ?? "admin";

if (role !== "admin" && role !== "superadmin") {
  throw new Error(`SEED_ADMIN_ROLE must be "admin" or "superadmin", got "${role}"`);
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await connectDB(mongoUri);

  const passwordHash = await hashPassword(password);

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: { email, password: passwordHash, role, isActive: true },
      $setOnInsert: { name, language: "en" },
    },
    { upsert: true, new: true }
  );

  console.log(`Admin user ready: ${user.email} (role: ${user.role}, id: ${user._id})`);

  await disconnectDB();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
