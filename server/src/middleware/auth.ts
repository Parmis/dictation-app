import { Request, Response, NextFunction } from "express";
import { validateToken } from "../db/tokens.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const organization = req.headers["x-organization"] as string | undefined;
    const userId = req.headers["x-user-id"] as string | undefined;

    if (!authHeader?.startsWith("Bearer ") || !organization || !userId) {
      res.status(401).json({ error: "Missing credentials" });
      return;
    }

    const token = authHeader.slice(7);
    const valid = await validateToken(token, organization, userId);

    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    req.userId = userId;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
