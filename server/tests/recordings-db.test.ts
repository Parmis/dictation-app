import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/db/pool.js", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "../src/db/pool.js";
import {
  createRecording,
  listRecordings,
  getRecording,
  updateRecording,
  deleteRecording,
} from "../src/db/recordings.js";

const query = vi.mocked(pool.query);

const USER_ID = "11111111-1111-1111-1111-111111111111";
const RECORDING_ID = "22222222-2222-2222-2222-222222222222";

const rawRow = {
  id: RECORDING_ID,
  title: "Hello",
  text: "Hello world",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

const mappedRow = {
  id: RECORDING_ID,
  title: "Hello",
  text: "Hello world",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

beforeEach(() => {
  query.mockReset();
});

describe("createRecording", () => {
  it("inserts and maps snake_case columns to camelCase", async () => {
    query.mockResolvedValue({ rows: [rawRow], rowCount: 1 } as never);

    const result = await createRecording(USER_ID, "Hello", "Hello world");

    expect(result).toEqual(mappedRow);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("INSERT INTO recordings");
    expect(params).toEqual([USER_ID, "Hello", "Hello world"]);
  });
});

describe("listRecordings", () => {
  it("selects by user ordered by created_at DESC", async () => {
    query.mockResolvedValue({ rows: [rawRow], rowCount: 1 } as never);

    const result = await listRecordings(USER_ID);

    expect(result).toEqual([mappedRow]);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("ORDER BY created_at DESC");
    expect(params).toEqual([USER_ID]);
  });
});

describe("getRecording", () => {
  it("returns the mapped row when found", async () => {
    query.mockResolvedValue({ rows: [rawRow], rowCount: 1 } as never);

    const result = await getRecording(USER_ID, RECORDING_ID);

    expect(result).toEqual(mappedRow);
    const [, params] = query.mock.calls[0];
    expect(params).toEqual([USER_ID, RECORDING_ID]);
  });

  it("returns null when not found", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 0 } as never);

    expect(await getRecording(USER_ID, RECORDING_ID)).toBeNull();
  });
});

describe("updateRecording", () => {
  it("updates only the provided fields", async () => {
    query.mockResolvedValue({ rows: [rawRow], rowCount: 1 } as never);

    await updateRecording(USER_ID, RECORDING_ID, { title: "New" });

    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("title = $1");
    expect(sql).not.toContain("text =");
    expect(sql).toContain("updated_at = now()");
    expect(sql).toContain("WHERE user_id = $2 AND id = $3");
    expect(params).toEqual(["New", USER_ID, RECORDING_ID]);
  });

  it("updates both fields with correct parameter order", async () => {
    query.mockResolvedValue({ rows: [rawRow], rowCount: 1 } as never);

    await updateRecording(USER_ID, RECORDING_ID, {
      title: "New",
      text: "New text",
    });

    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("title = $1");
    expect(sql).toContain("text = $2");
    expect(sql).toContain("WHERE user_id = $3 AND id = $4");
    expect(params).toEqual(["New", "New text", USER_ID, RECORDING_ID]);
  });

  it("falls back to a SELECT when the patch is empty", async () => {
    query.mockResolvedValue({ rows: [rawRow], rowCount: 1 } as never);

    const result = await updateRecording(USER_ID, RECORDING_ID, {});

    expect(result).toEqual(mappedRow);
    const [sql] = query.mock.calls[0];
    expect(sql).toContain("SELECT");
    expect(sql).not.toContain("UPDATE");
  });

  it("returns null when the recording does not exist", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 0 } as never);

    const result = await updateRecording(USER_ID, RECORDING_ID, {
      title: "New",
    });

    expect(result).toBeNull();
  });
});

describe("deleteRecording", () => {
  it("returns true when a row was deleted", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 1 } as never);

    expect(await deleteRecording(USER_ID, RECORDING_ID)).toBe(true);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("DELETE FROM recordings");
    expect(params).toEqual([USER_ID, RECORDING_ID]);
  });

  it("returns false when nothing matched", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 0 } as never);

    expect(await deleteRecording(USER_ID, RECORDING_ID)).toBe(false);
  });

  it("handles a null rowCount", async () => {
    query.mockResolvedValue({ rows: [], rowCount: null } as never);

    expect(await deleteRecording(USER_ID, RECORDING_ID)).toBe(false);
  });
});
