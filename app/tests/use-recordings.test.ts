import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../src/lib/api", () => ({
  listRecordings: vi.fn(),
  createRecording: vi.fn(),
  updateRecording: vi.fn(),
  deleteRecording: vi.fn(),
}));

import * as api from "../src/lib/api";
import { useRecordings } from "../src/hooks/use-recordings";
import type { Credentials, Recording } from "../src/types";

const credentials: Credentials = {
  token: "test-token",
  organization: "test-org",
  userId: "user-1",
  email: "user@example.com",
};

const recordingA: Recording = {
  id: "rec-a",
  title: "First",
  text: "First recording",
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const recordingB: Recording = {
  id: "rec-b",
  title: "Second",
  text: "Second recording",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.mocked(api.listRecordings).mockReset();
  vi.mocked(api.updateRecording).mockReset();
  vi.mocked(api.deleteRecording).mockReset();
});

describe("fetchAll", () => {
  it("loads recordings into state", async () => {
    vi.mocked(api.listRecordings).mockResolvedValue([recordingA, recordingB]);

    const { result } = renderHook(() => useRecordings(credentials));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.recordings).toEqual([recordingA, recordingB]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("stores an error message when the request fails", async () => {
    vi.mocked(api.listRecordings).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useRecordings(credentials));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.error).toBe("boom");
    expect(result.current.loading).toBe(false);
    expect(result.current.recordings).toEqual([]);
  });

  it("does nothing without credentials", async () => {
    const { result } = renderHook(() => useRecordings(null));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(api.listRecordings).not.toHaveBeenCalled();
  });
});

describe("update", () => {
  it("replaces the updated recording in state", async () => {
    vi.mocked(api.listRecordings).mockResolvedValue([recordingA, recordingB]);
    const updated = { ...recordingA, title: "Renamed" };
    vi.mocked(api.updateRecording).mockResolvedValue(updated);

    const { result } = renderHook(() => useRecordings(credentials));

    await act(async () => {
      await result.current.fetchAll();
    });
    await act(async () => {
      await result.current.update("rec-a", { title: "Renamed" });
    });

    expect(api.updateRecording).toHaveBeenCalledWith(credentials, "rec-a", {
      title: "Renamed",
    });
    expect(result.current.recordings).toEqual([updated, recordingB]);
  });
});

describe("remove", () => {
  it("removes the recording from state", async () => {
    vi.mocked(api.listRecordings).mockResolvedValue([recordingA, recordingB]);
    vi.mocked(api.deleteRecording).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRecordings(credentials));

    await act(async () => {
      await result.current.fetchAll();
    });
    await act(async () => {
      await result.current.remove("rec-a");
    });

    expect(api.deleteRecording).toHaveBeenCalledWith(credentials, "rec-a");
    expect(result.current.recordings).toEqual([recordingB]);
  });
});
