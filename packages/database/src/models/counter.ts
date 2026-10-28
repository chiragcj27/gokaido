import { mongoose } from "../client.js";

// Named atomic sequences, e.g. "order:BOM:261029" → the day's running order
// count. Incremented with findOneAndUpdate + $inc + upsert so concurrent
// callers always get distinct values.
export interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new mongoose.Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

export const Counter =
  mongoose.models.Counter ?? mongoose.model<ICounter>("Counter", counterSchema);

export async function nextSequence(key: string): Promise<number> {
  const doc = (await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean()) as ICounter | null;
  return doc!.seq;
}
