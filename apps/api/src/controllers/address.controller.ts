import type { Request, Response } from "express";
import { Address, mongoose } from "@gokaido/database";
import { createAddressSchema, updateAddressSchema } from "../schemas/address.schema.js";

export async function listAddresses(req: Request, res: Response): Promise<void> {
  const addresses = await Address.find({ user: req.user!.id }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ addresses });
}

export async function createAddress(req: Request, res: Response): Promise<void> {
  const parsed = createAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid address" });
    return;
  }

  const userId = req.user!.id;
  const existingCount = await Address.countDocuments({ user: userId });
  const isDefault = existingCount === 0 || Boolean(parsed.data.isDefault);

  if (isDefault) {
    await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });
  }

  const address = await Address.create({ ...parsed.data, user: userId, isDefault });
  res.status(201).json({ address });
}

export async function updateAddress(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid address id" });
    return;
  }

  const parsed = updateAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid address" });
    return;
  }

  const userId = req.user!.id;
  const address = await Address.findOne({ _id: req.params.id, user: userId });
  if (!address) {
    res.status(404).json({ error: "Address not found" });
    return;
  }

  if (parsed.data.isDefault === true) {
    await Address.updateMany(
      { user: userId, _id: { $ne: address._id }, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  Object.assign(address, parsed.data);
  await address.save();

  res.json({ address });
}

export async function deleteAddress(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid address id" });
    return;
  }

  const userId = req.user!.id;
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: userId });
  if (!address) {
    res.status(404).json({ error: "Address not found" });
    return;
  }

  if (address.isDefault) {
    const next = await Address.findOne({ user: userId }).sort({ createdAt: 1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }

  res.json({ success: true });
}
