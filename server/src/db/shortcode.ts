import { pool } from "./pool.js";

interface ShortcodeResult {
  user_id: string;
  email: string;
  organization: string;
  organization_token: string;
}

export async function lookupAndUseShortcode(
  code: string,
): Promise<ShortcodeResult | null> {
  const result = await pool.query(
    `UPDATE shortcodes s
     SET used_at = now()
     FROM users u, organizations o, organization_tokens ot
     WHERE s.code = $1
       AND s.used_at IS NULL
       AND s.expires_at > now()
       AND u.id = s.user_id
       AND o.id = s.organization_id
       AND ot.id = s.token_id
       AND ot.revoked_at IS NULL
     RETURNING u.id as user_id, u.email, o.slug as organization, ot.token_hash as organization_token`,
    [code],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as ShortcodeResult;
}
