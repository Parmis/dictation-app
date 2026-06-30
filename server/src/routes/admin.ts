import { Router } from "express";
import crypto from "crypto";
import { config } from "../config.js";
import { pool } from "../db/pool.js";

const router = Router();

router.post("/api/admin/shortcodes", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${config.adminApiKey}`) {
      res.status(401).json({ error: "Invalid admin API key" });
      return;
    }

    const { email } = req.body;
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "email is required" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get or create default org
      const orgResult = await client.query(
        `INSERT INTO organizations (name, slug)
         VALUES ('Default', 'default')
         ON CONFLICT (slug) DO UPDATE SET name = 'Default'
         RETURNING id`
      );
      const orgId = orgResult.rows[0].id;

      // Get or create user
      const userResult = await client.query(
        `INSERT INTO users (email, organization_id)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET organization_id = $2
         RETURNING id`,
        [email, orgId]
      );
      const userId = userResult.rows[0].id;

      // Create token
      const token = crypto.randomBytes(32).toString("hex");
      const tokenResult = await client.query(
        `INSERT INTO organization_tokens (organization_id, token_hash)
         VALUES ($1, $2)
         RETURNING id`,
        [orgId, token]
      );
      const tokenId = tokenResult.rows[0].id;

      // Create shortcode
      const code = crypto.randomBytes(5).toString("hex").toUpperCase();
      await client.query(
        `INSERT INTO shortcodes (code, user_id, organization_id, token_id, expires_at)
         VALUES ($1, $2, $3, $4, now() + interval '24 hours')`,
        [code, userId, orgId, tokenId]
      );

      await client.query("COMMIT");

      res.json({ shortcode: code, email, expires_in: "24 hours" });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Admin shortcode error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
