import "dotenv/config";
import { connectDB, disconnectDB, Product, mongoose } from "@gokaido/database";
import { refreshProductEmbeddings } from "../services/productEmbedding.js";
import { isOpenAIConfigured } from "../services/openai.js";

// Embeds every product whose searchable text (or the embedding model) changed
// since it was last embedded — and any never embedded. Safe to re-run: up-to-
// date products cost a hash comparison, no OpenAI call. Run once after first
// deploying search, after changing OPENAI_EMBEDDING_MODEL, or to catch up
// products whose save-time embedding failed.
//   pnpm --filter @gokaido/api search:backfill
async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }
  if (!isOpenAIConfigured()) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  await connectDB(mongoUri);
  const ids = (await Product.find().select("_id").lean()).map((p) => p._id as mongoose.Types.ObjectId);
  const result = await refreshProductEmbeddings(ids);
  console.log(`Embeddings: ${result.updated} updated, ${result.unchanged} unchanged, ${result.failed} failed`);
  if (result.failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
