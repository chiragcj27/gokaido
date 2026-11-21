import "dotenv/config";
import { connectDB, disconnectDB, RewardTransaction, User, mongoose } from "@gokaido/database";
import { pointsExpiryFrom } from "../utils/rewardPoints.js";

// One-off, for the switch to batch-based points (Nov 2026). Balances earned
// under the old model (1 pt / ₹100, signup referral bonuses) have no batch
// behind them, so the new FIFO spend can't draw on them. This gives each such
// user one "opening balance" batch covering the gap, valid 1 year from now.
// Also syncs indexes (the new unique (order, type) index on batches).
// Safe to re-run: users already covered by batches are skipped.
//   pnpm --filter @gokaido/api rewards:migrate            (dry run)
//   pnpm --filter @gokaido/api rewards:migrate -- --apply
async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not set");
  const apply = process.argv.includes("--apply");

  await connectDB(mongoUri);
  if (apply) await RewardTransaction.syncIndexes();

  const users = await User.find({ rewardPoints: { $gt: 0 } })
    .select("_id rewardPoints")
    .lean<{ _id: mongoose.Types.ObjectId; rewardPoints: number }[]>();

  let migrated = 0;
  for (const user of users) {
    const [row] = await RewardTransaction.aggregate<{ points: number }>([
      { $match: { user: user._id, status: "available" } },
      { $group: { _id: null, points: { $sum: "$remaining" } } },
    ]);
    const gap = user.rewardPoints - (row?.points ?? 0);
    if (gap <= 0) continue;

    console.log(`${user._id}: ${gap} unbatched point(s)`);
    migrated++;
    if (!apply) continue;
    const now = new Date();
    await RewardTransaction.create({
      user: user._id,
      points: gap,
      type: "admin_adjustment",
      description: "Opening balance carried over to the new rewards programme",
      status: "available",
      remaining: gap,
      availableAt: now,
      expiresAt: pointsExpiryFrom(now),
      balance: user.rewardPoints,
    });
  }
  console.log(`${migrated} user(s) ${apply ? "migrated" : "to migrate — re-run with --apply"}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
