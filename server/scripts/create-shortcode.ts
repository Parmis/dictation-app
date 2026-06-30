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

async function createShortcode() {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf("--email");

  if (emailIdx === -1 || !args[emailIdx + 1]) {
    console.error(
      "Usage: npm run shortcode:create -- --email user@example.com",
    );
    process.exit(1);
  }

  const email = args[emailIdx + 1];
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get or create default org
    let orgResult = await client.query(
      `SELECT id FROM organizations WHERE slug = 'default'`,
    );
    let orgId: string;
    if (orgResult.rows.length === 0) {
      const ins = await client.query(
        `INSERT INTO organizations (name, slug) VALUES ('Default', 'default') RETURNING id`,
      );
      orgId = ins.rows[0].id;
    } else {
      orgId = orgResult.rows[0].id;
    }

    // Get or create user
    let userResult = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [email],
    );
    let userId: string;
    if (userResult.rows.length === 0) {
      const ins = await client.query(
        `INSERT INTO users (email, organization_id) VALUES ($1, $2) RETURNING id`,
        [email, orgId],
      );
      userId = ins.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Create token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenResult = await client.query(
      `INSERT INTO organization_tokens (organization_id, token_hash) VALUES ($1, $2) RETURNING id`,
      [orgId, token],
    );
    const tokenId = tokenResult.rows[0].id;

    // Create shortcode
    const code = crypto.randomBytes(5).toString("hex").toUpperCase();
    await client.query(
      `INSERT INTO shortcodes (code, user_id, organization_id, token_id, expires_at)
       VALUES ($1, $2, $3, $4, now() + interval '24 hours')`,
      [code, userId, orgId, tokenId],
    );

    await client.query("COMMIT");

    console.log(`Shortcode created for ${email}: ${code}`);
    console.log(`Expires in 24 hours`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

createShortcode().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
