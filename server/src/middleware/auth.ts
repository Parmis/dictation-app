import { Request, Response, NextFunction } from "express";
import { validateToken } from "../db/tokens.js";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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

  next();
}
