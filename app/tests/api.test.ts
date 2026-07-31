import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  listRecordings,
  createRecording,
  updateRecording,
  processRecording,
  deleteRecording,
} from "../src/lib/api";
import type { Credentials } from "../src/types";

const credentials: Credentials = {
  token: "test-token",
  organization: "test-org",
  userId: "user-1",
  email: "user@example.com",
};

const recording = {
  id: "rec-1",
  title: "Hello",
  text: "Hello world",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("listRecordings", () => {
  it("GETs /recordings with auth headers", async () => {
    fetchMock.mockResolvedValue(jsonResponse([recording]));

    const result = await listRecordings(credentials);

    expect(result).toEqual([recording]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3000/api/v1/recordings");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-token",
      "x-organization": "test-org",
      "x-user-id": "user-1",
    });
  });
});

describe("createRecording", () => {
  it("POSTs text and title as JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse(recording, 201));

    const result = await createRecording(credentials, "Hello world", "Hello");

    expect(result).toEqual(recording);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3000/api/v1/recordings");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      text: "Hello world",
      title: "Hello",
    });
  });
});

describe("updateRecording", () => {
  it("PUTs the patch to /recordings/:id", async () => {
    fetchMock.mockResolvedValue(jsonResponse(recording));

    await updateRecording(credentials, "rec-1", { title: "New" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3000/api/v1/recordings/rec-1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ title: "New" });
  });
});

describe("processRecording", () => {
  it("POSTs to /recordings/:id/process and returns the updated recording", async () => {
    const processed = { ...recording, text: "Hello world." };
    fetchMock.mockResolvedValue(jsonResponse(processed));

    const result = await processRecording(credentials, "rec-1");

    expect(result).toEqual(processed);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3000/api/v1/recordings/rec-1/process");
    expect(init.method).toBe("POST");
  });
});

describe("deleteRecording", () => {
  it("resolves on a 204 response with no body", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error("no body");
      },
    });

    await expect(deleteRecording(credentials, "rec-1")).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3000/api/v1/recordings/rec-1");
    expect(init.method).toBe("DELETE");
  });
});

describe("error handling", () => {
  it("throws the server-provided error message", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "text is required" }, 400));

    await expect(createRecording(credentials, "", "")).rejects.toThrow(
      "text is required",
    );
  });

  it("falls back to a generic message when the body is not JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid json");
      },
    });

    await expect(listRecordings(credentials)).rejects.toThrow(
      "Request failed",
    );
  });
});
