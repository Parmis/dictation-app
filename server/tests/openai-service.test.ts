import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/config.js", () => ({
  config: {
    openaiApiKey: "test-key",
    openaiModel: "gpt-4o-mini",
  },
}));

import { isAiConfigured, processTranscript } from "../src/services/openai.js";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("isAiConfigured", () => {
  it("is true when an API key is set", () => {
    expect(isAiConfigured()).toBe(true);
  });
});

describe("processTranscript", () => {
  it("sends the text to OpenAI and returns the trimmed completion", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "  Formatted text.  " } }],
      }),
    });

    const result = await processTranscript("raw transcript");

    expect(result).toBe("Formatted text.");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("gpt-4o-mini");
    expect(body.messages[1]).toEqual({
      role: "user",
      content: "raw transcript",
    });
  });

  it("throws when OpenAI responds with an error status", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "rate limited",
    });

    await expect(processTranscript("text")).rejects.toThrow(
      "OpenAI request failed (429)",
    );
  });

  it("throws when the completion is empty", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "  " } }] }),
    });

    await expect(processTranscript("text")).rejects.toThrow(
      "empty response",
    );
  });
});
