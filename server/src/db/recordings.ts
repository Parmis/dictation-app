import { pool } from "./pool.js";

export interface RecordingRow {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface RawRecordingRow {
  id: string;
  title: string;
  text: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: RawRecordingRow): RecordingRow {
  return {
    id: row.id,
    title: row.title,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS = "id, title, text, created_at, updated_at";

export async function createRecording(
  userId: string,
  title: string,
  text: string,
): Promise<RecordingRow> {
  const result = await pool.query<RawRecordingRow>(
    `INSERT INTO recordings (user_id, title, text)
     VALUES ($1, $2, $3)
     RETURNING ${SELECT_COLUMNS}`,
    [userId, title, text],
  );
  return mapRow(result.rows[0]);
}

export async function listRecordings(userId: string): Promise<RecordingRow[]> {
  const result = await pool.query<RawRecordingRow>(
    `SELECT ${SELECT_COLUMNS}
     FROM recordings
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows.map(mapRow);
}

export async function getRecording(
  userId: string,
  id: string,
): Promise<RecordingRow | null> {
  const result = await pool.query<RawRecordingRow>(
    `SELECT ${SELECT_COLUMNS}
     FROM recordings
     WHERE user_id = $1 AND id = $2`,
    [userId, id],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function updateRecording(
  userId: string,
  id: string,
  patch: { title?: string; text?: string },
): Promise<RecordingRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];

  if (patch.title !== undefined) {
    values.push(patch.title);
    sets.push(`title = $${values.length}`);
  }
  if (patch.text !== undefined) {
    values.push(patch.text);
    sets.push(`text = $${values.length}`);
  }

  if (sets.length === 0) {
    return getRecording(userId, id);
  }

  sets.push("updated_at = now()");
  values.push(userId);
  const userIdParam = values.length;
  values.push(id);
  const idParam = values.length;

  const result = await pool.query<RawRecordingRow>(
    `UPDATE recordings
     SET ${sets.join(", ")}
     WHERE user_id = $${userIdParam} AND id = $${idParam}
     RETURNING ${SELECT_COLUMNS}`,
    values,
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function deleteRecording(
  userId: string,
  id: string,
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM recordings WHERE user_id = $1 AND id = $2`,
    [userId, id],
  );
  return (result.rowCount ?? 0) > 0;
}
