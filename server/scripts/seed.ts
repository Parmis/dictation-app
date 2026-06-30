import crypto from "crypto";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const pool = new pg.Pool({
  host: process.env.PGHOST || "localhost",
  port: parseInt(process.env.PGPORT || "5432", 10),
  database: process.env.PGDATABASE || "dictation",
  user: process.env.PGUSER || "dictation",
  password: process.env.PGPASSWORD || "dictation",
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create org
    const orgResult = await client.query(
      `INSERT INTO organizations (name, slug)
       VALUES ('Default', 'default')
       ON CONFLICT (slug) DO UPDATE SET name = 'Default'
       RETURNING id`,
    );
    const orgId = orgResult.rows[0].id;

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, organization_id)
       VALUES ('dev@localhost', $1)
       ON CONFLICT (email) DO UPDATE SET organization_id = $1
       RETURNING id`,
      [orgId],
    );
    const userId = userResult.rows[0].id;

    // Create token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenResult = await client.query(
      `INSERT INTO organization_tokens (organization_id, token_hash)
       VALUES ($1, $2)
       RETURNING id`,
      [orgId, token],
    );
    const tokenId = tokenResult.rows[0].id;

    // Create shortcode (expires in 24 hours)
    const code = crypto.randomBytes(5).toString("hex").toUpperCase();
    await client.query(
      `INSERT INTO shortcodes (code, user_id, organization_id, token_id, expires_at)
       VALUES ($1, $2, $3, $4, now() + interval '24 hours')`,
      [code, userId, orgId, tokenId],
    );

    await client.query("COMMIT");

    console.log("=== Seed Complete ===");
    console.log(`Organization: Default (${orgId})`);
    console.log(`User: dev@localhost (${userId})`);
    console.log(`Token: ${token}`);
    console.log(`Shortcode: ${code}`);
    console.log(`Shortcode expires in 24 hours`);
    console.log("=====================");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
