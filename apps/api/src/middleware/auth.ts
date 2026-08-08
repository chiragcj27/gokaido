import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { User } from "@gokaido/database";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    type Pick = { _id: unknown; role: string; isActive: boolean };
    const user = (await User.findById(payload.sub)
      .select("_id role isActive")
      .lean()) as Pick | null;

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = { id: String(user._id), role: user.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
