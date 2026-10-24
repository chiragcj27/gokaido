import "dotenv/config";
import { connectDB, disconnectDB, mongoose } from "@gokaido/database";
import { TEXT_SEARCH_INDEX, TEXT_SEARCH_INDEX_DEFINITION } from "../services/productSearch.js";

// Creates (or updates in place) the Atlas Search index product search needs.
// Atlas builds it asynchronously — a minute or so from PENDING/BUILDING to
// READY; until then keyword search falls back to the $text index. (Vector
// search needs no Atlas index — see the note at the top of productSearch.ts.)
//   pnpm --filter @gokaido/api search:indexes
async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await connectDB(mongoUri);
  const products = mongoose.connection.db!.collection("products");
  const existing = new Set((await products.listSearchIndexes().toArray()).map((i) => i.name as string));

  const indexes = [{ name: TEXT_SEARCH_INDEX, type: "search" as const, definition: TEXT_SEARCH_INDEX_DEFINITION }];
  for (const index of indexes) {
    if (existing.has(index.name)) {
      await products.updateSearchIndex(index.name, index.definition);
      console.log(`Updated ${index.name}`);
    } else {
      await products.createSearchIndex(index);
      console.log(`Created ${index.name}`);
    }
  }

  for (const i of await products.listSearchIndexes().toArray()) {
    console.log(`  ${i.name}: ${(i as { status?: string }).status}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
