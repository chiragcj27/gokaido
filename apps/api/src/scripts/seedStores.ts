import "dotenv/config";
import { connectDB, disconnectDB, Store } from "@gokaido/database";

// Backfills the placeholder stores the homepage "Visit Our Store" section used
// to hard-code (cities mirror the design mockup). Upserts by name, so re-running
// it won't duplicate anything, and only fills fields on insert — edits made in
// the admin Stores page afterwards are left alone.
//   pnpm --filter @gokaido/api seed:stores
const CITIES = ["Pune", "Nagpur", "Bhilai", "Surat", "Baroda", "Indore", "Guwahati", "Bengaluru", "Goa", "Chennai"];

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await connectDB(mongoUri);

  let inserted = 0;
  for (const [i, city] of CITIES.entries()) {
    const name = `Gokaido VR Mall ${city}`;
    const res = await Store.updateOne(
      { name },
      {
        $setOnInsert: {
          city,
          name,
          address: "136-B, Deccan Chamber Building, Jagarnath Shankar Sheth (J.S.S.) Road, Girgaon, Mumbai - 400004",
          hours: "11 AM - 10 PM (Open Everyday)",
          phone: "+91 7996000781",
          sortOrder: i,
          isActive: true,
        },
      },
      { upsert: true }
    );
    if (res.upsertedCount > 0) inserted++;
  }

  console.log(`Stores ready: ${inserted} inserted, ${CITIES.length - inserted} already present`);

  await disconnectDB();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
