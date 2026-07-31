import { config } from "../config.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT =
  "You are a transcription editor. Correct grammar and spelling, add punctuation, " +
  "and format the text into readable paragraphs. Preserve the speaker's wording and " +
  "meaning — do not summarize, add, or remove content. Return only the corrected text.";

export function isAiConfigured(): boolean {
  return Boolean(config.openaiApiKey);
}

export async function processTranscript(text: string): Promise<string> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `OpenAI request failed (${res.status}): ${body.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content || !content.trim()) {
    throw new Error("OpenAI returned an empty response");
  }
  return content.trim();
}
