import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import express from "express";
import { createServer, type Server } from "http";
import type { AddressInfo } from "net";

vi.mock("../src/db/tokens.js", () => ({
  validateToken: vi.fn(
    async (token: string) => token === "valid-token",
  ),
}));

vi.mock("../src/db/recordings.js", () => ({
  createRecording: vi.fn(),
  listRecordings: vi.fn(),
  getRecording: vi.fn(),
  updateRecording: vi.fn(),
  deleteRecording: vi.fn(),
}));

import recordingsRouter from "../src/routes/recordings.js";
import * as db from "../src/db/recordings.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const RECORDING_ID = "22222222-2222-2222-2222-222222222222";

const sampleRecording = {
  id: RECORDING_ID,
  title: "Hello world",
  text: "Hello world this is a test",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const authHeaders = {
  Authorization: "Bearer valid-token",
  "x-organization": "test-org",
  "x-user-id": USER_ID,
  "Content-Type": "application/json",
};

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use(recordingsRouter);
  server = createServer(app);
  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", resolve),
  );
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(
  () => new Promise<void>((resolve) => server.close(() => resolve())),
);

beforeEach(() => {
  vi.mocked(db.createRecording).mockReset();
  vi.mocked(db.listRecordings).mockReset();
  vi.mocked(db.getRecording).mockReset();
  vi.mocked(db.updateRecording).mockReset();
  vi.mocked(db.deleteRecording).mockReset();
});

describe("auth", () => {
  it("rejects requests without credentials", async () => {
    const res = await fetch(`${baseUrl}/api/v1/recordings`);
    expect(res.status).toBe(401);
    expect(db.listRecordings).not.toHaveBeenCalled();
  });

  it("rejects requests with an invalid token", async () => {
    const res = await fetch(`${baseUrl}/api/v1/recordings`, {
      headers: { ...authHeaders, Authorization: "Bearer wrong-token" },
    });
    expect(res.status).toBe(401);
    expect(db.listRecordings).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/recordings", () => {
  it("returns the user's recordings", async () => {
    vi.mocked(db.listRecordings).mockResolvedValue([sampleRecording]);

    const res = await fetch(`${baseUrl}/api/v1/recordings`, {
      headers: authHeaders,
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([sampleRecording]);
    expect(db.listRecordings).toHaveBeenCalledWith(USER_ID);
  });

  it("returns 500 when the database fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(db.listRecordings).mockRejectedValue(new Error("db down"));

    const res = await fetch(`${baseUrl}/api/v1/recordings`, {
      headers: authHeaders,
    });

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
    consoleError.mockRestore();
  });
});

describe("POST /api/v1/recordings", () => {
  it("creates a recording with the provided title", async () => {
    vi.mocked(db.createRecording).mockResolvedValue(sampleRecording);

    const res = await fetch(`${baseUrl}/api/v1/recordings`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ text: "Hello world", title: "  My title  " }),
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(sampleRecording);
    expect(db.createRecording).toHaveBeenCalledWith(
      USER_ID,
      "My title",
      "Hello world",
    );
  });

  it("falls back to the first six words as title", async () => {
    vi.mocked(db.createRecording).mockResolvedValue(sampleRecording);

    const res = await fetch(`${baseUrl}/api/v1/recordings`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        text: "one two three four five six seven eight",
      }),
    });

    expect(res.status).toBe(201);
    expect(db.createRecording).toHaveBeenCalledWith(
      USER_ID,
      "one two three four five six",
      "one two three four five six seven eight",
    );
  });

  it("rejects a missing text field", async () => {
    const res = await fetch(`${baseUrl}/api/v1/recordings`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ title: "No text" }),
    });

    expect(res.status).toBe(400);
    expect(db.createRecording).not.toHaveBeenCalled();
  });

  it("rejects whitespace-only text", async () => {
    const res = await fetch(`${baseUrl}/api/v1/recordings`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ text: "   " }),
    });

    expect(res.status).toBe(400);
    expect(db.createRecording).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/recordings/:id", () => {
  it("returns a single recording", async () => {
    vi.mocked(db.getRecording).mockResolvedValue(sampleRecording);

    const res = await fetch(
      `${baseUrl}/api/v1/recordings/${RECORDING_ID}`,
      { headers: authHeaders },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(sampleRecording);
    expect(db.getRecording).toHaveBeenCalledWith(USER_ID, RECORDING_ID);
  });

  it("returns 404 for a malformed id without querying the db", async () => {
    const res = await fetch(`${baseUrl}/api/v1/recordings/not-a-uuid`, {
      headers: authHeaders,
    });

    expect(res.status).toBe(404);
    expect(db.getRecording).not.toHaveBeenCalled();
  });

  it("returns 404 when the recording does not exist", async () => {
    vi.mocked(db.getRecording).mockResolvedValue(null);

    const res = await fetch(
      `${baseUrl}/api/v1/recordings/${RECORDING_ID}`,
      { headers: authHeaders },
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/v1/recordings/:id", () => {
  it("updates title and text", async () => {
    const updated = { ...sampleRecording, title: "New", text: "New text" };
    vi.mocked(db.updateRecording).mockResolvedValue(updated);

    const res = await fetch(
      `${baseUrl}/api/v1/recordings/${RECORDING_ID}`,
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ title: "New", text: "New text" }),
      },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(db.updateRecording).toHaveBeenCalledWith(USER_ID, RECORDING_ID, {
      title: "New",
      text: "New text",
    });
  });

  it("rejects an empty patch", async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/recordings/${RECORDING_ID}`,
      { method: "PUT", headers: authHeaders, body: JSON.stringify({}) },
    );

    expect(res.status).toBe(400);
    expect(db.updateRecording).not.toHaveBeenCalled();
  });

  it("rejects a non-string title", async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/recordings/${RECORDING_ID}`,
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ title: 42 }),
      },
    );

    expect(res.status).toBe(400);
    expect(db.updateRecording).not.toHaveBeenCalled();
  });

  it("returns 404 when the recording does not exist", async () => {
    vi.mocked(db.updateRecording).mockResolvedValue(null);

    const res = await fetch(
      `${baseUrl}/api/v1/recordings/${RECORDING_ID}`,
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ title: "New" }),
      },
    );

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/recordings/:id", () => {
  it("deletes a recording", async () => {
    vi.mocked(db.deleteRecording).mockResolvedValue(true);

    const res = await fetch(
      `${baseUrl}/api/v1/recordings/${RECORDING_ID}`,
      { method: "DELETE", headers: authHeaders },
    );

    expect(res.status).toBe(204);
    expect(db.deleteRecording).toHaveBeenCalledWith(USER_ID, RECORDING_ID);
  });

  it("returns 404 when the recording does not exist", async () => {
    vi.mocked(db.deleteRecording).mockResolvedValue(false);

    const res = await fetch(
      `${baseUrl}/api/v1/recordings/${RECORDING_ID}`,
      { method: "DELETE", headers: authHeaders },
    );

    expect(res.status).toBe(404);
  });
});
