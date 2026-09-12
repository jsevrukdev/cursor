import type { BoardResult } from "./boardFallback";
import { normalizeBoard } from "./boardFallback";

type XaiMessage = {
  role: string;
  content: string;
};

type XaiResponse = {
  choices?: { message?: { content?: string } }[];
};

export async function boardWithXai(args: {
  prompt: string;
  targetDurationMs: number;
  aspect: "9:16" | "16:9" | "1:1";
  tone: string;
}): Promise<BoardResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not set");
  }
  const seconds = Math.round(args.targetDurationMs / 1000);
  const body = {
    model: process.env.XAI_MODEL ?? "grok-4-fast-non-reasoning",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are a commercial director. Return ONLY valid JSON matching the schema. No markdown.",
      },
      {
        role: "user",
        content: `Break this into a ${seconds}s storyboard of 4 to 8 shots.
Aspect: ${args.aspect}. Tone: ${args.tone}.
Durations must sum to ${args.targetDurationMs} milliseconds.
Keep one consistent character and location unless the story clearly changes scene.
JSON schema:
{
  "title": "string",
  "logline": "string",
  "styleBible": {
    "look": "string",
    "palette": "string",
    "camera": "string",
    "references": ["string"]
  },
  "beats": [{ "t": "0-5s", "summary": "string" }],
  "shots": [{
    "index": 1,
    "title": "string",
    "durationMs": 4000,
    "camera": "string",
    "action": "string",
    "dialogue": "string or null",
    "visualPrompt": "string",
    "negativePrompt": "string"
  }]
}
Story:
${args.prompt}`,
      } satisfies XaiMessage,
    ],
  };

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`x.ai Chat failed (${response.status}): ${text.slice(0, 280)}`);
  }
  const json = (await response.json()) as XaiResponse;
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("x.ai returned an empty shot list");
  }
  const parsed = parseBoardJson(content);
  return normalizeBoard(parsed, args.targetDurationMs);
}

function parseBoardJson(content: string): BoardResult {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  const parsed: unknown = JSON.parse(trimmed);
  if (!isBoardResult(parsed)) {
    throw new Error("x.ai JSON did not match the shot-list schema");
  }
  return parsed;
}

function isBoardResult(value: unknown): value is BoardResult {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.title === "string" &&
    typeof record.logline === "string" &&
    Array.isArray(record.shots) &&
    record.shots.length > 0
  );
}
