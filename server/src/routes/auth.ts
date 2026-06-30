import { Router } from "express";
import rateLimit from "express-rate-limit";
import { lookupAndUseShortcode } from "../db/shortcode.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const pairLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many pairing attempts, try again later" },
});

router.post("/api/v1/shortcode/pair", pairLimiter, async (req, res) => {
  try {
    const { shortcode } = req.body;

    if (!shortcode || typeof shortcode !== "string") {
      res.status(400).json({ error: "shortcode is required" });
      return;
    }

    const result = await lookupAndUseShortcode(shortcode.trim());

    if (!result) {
      res.status(404).json({ error: "Invalid or expired shortcode" });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error("Pairing error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authMiddleware, (_req, res) => {
  res.json({ status: "authenticated" });
});

export default router;
