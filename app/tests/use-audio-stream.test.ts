import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  lastWs: null as {
    onMessage: (msg: {
      type: string;
      text?: string;
      isFinal?: boolean;
    }) => void;
    onClose: () => void;
    connect: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  } | null,
  audioStart: vi.fn(),
  audioStop: vi.fn(),
}));

vi.mock("../src/lib/websocket", () => ({
  DictationWebSocket: class {
    onMessage;
    onClose;
    connect = vi.fn().mockResolvedValue(undefined);
    sendAudio = vi.fn();
    close = vi.fn();

    constructor(
      onMessage: (msg: object) => void,
      onClose: () => void,
    ) {
      this.onMessage = onMessage;
      this.onClose = onClose;
      mocks.lastWs = this as never;
    }
  },
}));

vi.mock("../src/lib/audio", () => ({
  AudioCapture: class {
    start = mocks.audioStart;
    stop = mocks.audioStop;
  },
}));

vi.mock("../src/lib/api", () => ({
  createRecording: vi.fn(),
}));

import { createRecording } from "../src/lib/api";
import { useAudioStream } from "../src/hooks/use-audio-stream";
import type { Credentials } from "../src/types";

const credentials: Credentials = {
  token: "test-token",
  organization: "test-org",
  userId: "user-1",
  email: "user@example.com",
};

const savedRecording = {
  id: "rec-1",
  title: "hello world",
  text: "hello world",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function transcriptMessage(text: string, isFinal = true) {
  return { type: "transcript", text, isFinal };
}

beforeEach(() => {
  mocks.lastWs = null;
  mocks.audioStart.mockReset().mockResolvedValue(undefined);
  mocks.audioStop.mockReset();
  vi.mocked(createRecording).mockReset();
});

describe("start", () => {
  it("connects and starts recording", async () => {
    const { result } = renderHook(() => useAudioStream(credentials));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.recording).toBe(true);
    expect(result.current.connected).toBe(true);
    expect(mocks.audioStart).toHaveBeenCalled();
  });

  it("does nothing without credentials", async () => {
    const { result } = renderHook(() => useAudioStream(null));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.recording).toBe(false);
    expect(mocks.lastWs).toBeNull();
  });
});

describe("transcript accumulation", () => {
  it("appends only final transcript messages", async () => {
    const { result } = renderHook(() => useAudioStream(credentials));

    await act(async () => {
      await result.current.start();
    });
    act(() => {
      mocks.lastWs!.onMessage(transcriptMessage("hello"));
      mocks.lastWs!.onMessage(transcriptMessage("interim", false));
      mocks.lastWs!.onMessage(transcriptMessage("world"));
    });

    expect(result.current.transcript).toBe("hello world ");
  });
});

describe("stop", () => {
  it("saves the transcript and clears it on success", async () => {
    vi.mocked(createRecording).mockResolvedValue(savedRecording);
    const onSaved = vi.fn();
    const { result } = renderHook(() =>
      useAudioStream(credentials, onSaved),
    );

    await act(async () => {
      await result.current.start();
    });
    act(() => {
      mocks.lastWs!.onMessage(transcriptMessage("hello world"));
    });
    await act(async () => {
      await result.current.stop();
    });

    expect(createRecording).toHaveBeenCalledWith(
      credentials,
      "hello world",
      "hello world",
    );
    expect(onSaved).toHaveBeenCalledWith(savedRecording);
    expect(result.current.transcript).toBe("");
    expect(result.current.recording).toBe(false);
    expect(mocks.audioStop).toHaveBeenCalled();
  });

  it("uses the first six words of the transcript as title", async () => {
    vi.mocked(createRecording).mockResolvedValue(savedRecording);
    const { result } = renderHook(() => useAudioStream(credentials));

    await act(async () => {
      await result.current.start();
    });
    act(() => {
      mocks.lastWs!.onMessage(
        transcriptMessage("one two three four five six seven eight"),
      );
    });
    await act(async () => {
      await result.current.stop();
    });

    expect(createRecording).toHaveBeenCalledWith(
      credentials,
      "one two three four five six seven eight",
      "one two three four five six",
    );
  });

  it("keeps the transcript and reports an error when saving fails", async () => {
    vi.mocked(createRecording).mockRejectedValue(new Error("save failed"));
    const onSaved = vi.fn();
    const { result } = renderHook(() =>
      useAudioStream(credentials, onSaved),
    );

    await act(async () => {
      await result.current.start();
    });
    act(() => {
      mocks.lastWs!.onMessage(transcriptMessage("precious dictation"));
    });
    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.error).toBe("save failed");
    expect(result.current.transcript).toBe("precious dictation ");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("does not save an empty transcript", async () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() =>
      useAudioStream(credentials, onSaved),
    );

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.stop();
    });

    expect(createRecording).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });
});

describe("clearTranscript", () => {
  it("clears the transcript so it will not be saved", async () => {
    const { result } = renderHook(() => useAudioStream(credentials));

    await act(async () => {
      await result.current.start();
    });
    act(() => {
      mocks.lastWs!.onMessage(transcriptMessage("scratch this"));
    });
    act(() => {
      result.current.clearTranscript();
    });
    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.transcript).toBe("");
    expect(createRecording).not.toHaveBeenCalled();
  });
});
