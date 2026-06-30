import { pool } from "./pool.js";

export async function validateToken(
  token: string,
  organizationSlug: string,
  userId: string,
): Promise<boolean> {
  const result = await pool.query(
    `SELECT ot.id
     FROM organization_tokens ot
     JOIN organizations o ON o.id = ot.organization_id
     JOIN users u ON u.organization_id = o.id
     WHERE ot.token_hash = $1
       AND o.slug = $2
       AND u.id = $3
       AND ot.revoked_at IS NULL`,
    [token, organizationSlug, userId],
  );

  return result.rows.length > 0;
}
