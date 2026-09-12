export type Aspect = "9:16" | "16:9" | "1:1";

export type StyleBible = {
  look: string;
  palette: string;
  camera: string;
  references: string[];
};

export type PlannedShot = {
  index: number;
  title: string;
  durationMs: number;
  camera: string;
  action: string;
  dialogue: string | null;
  visualPrompt: string;
  negativePrompt: string;
};

export type BoardResult = {
  title: string;
  logline: string;
  styleBible: StyleBible;
  beats: { t: string; summary: string }[];
  shots: PlannedShot[];
};

const NEGATIVE =
  "text overlay, watermark, logo, extra fingers, deformed face, low quality";

function splitBeats(prompt: string): string[] {
  const parts = prompt
    .split(/(?<=[.!?])\s+|(?:\n+)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8);
  if (parts.length === 0) {
    return [prompt.trim()];
  }
  if (parts.length > 8) {
    return parts.slice(0, 8);
  }
  if (parts.length < 4) {
    const padded = [...parts];
    const extras = [
      "Hold on the subject in the same space.",
      "Move closer to the key object in the scene.",
      "A reaction: the subject looks to camera.",
      "End on the payoff image, still, quiet.",
    ];
    let i = 0;
    while (padded.length < 4) {
      padded.push(extras[i % extras.length] ?? "Hold.");
      i += 1;
    }
    return padded;
  }
  return parts;
}

function scaleDurations(count: number, targetMs: number): number[] {
  const base = Math.floor(targetMs / count);
  const remainder = targetMs - base * count;
  return Array.from({ length: count }, (_, i) =>
    i === count - 1 ? base + remainder : base,
  );
}

export function fallbackBoard(args: {
  prompt: string;
  targetDurationMs: number;
  aspect: Aspect;
  tone: string;
}): BoardResult {
  const beats = splitBeats(args.prompt);
  const durations = scaleDurations(beats.length, args.targetDurationMs);
  const look =
    args.tone.toLowerCase().includes("cinematic")
      ? "cinematic, motivated practicals, shallow depth"
      : args.tone.toLowerCase().includes("explainer")
        ? "clean product lighting, graphic, readable"
        : "handheld UGC, morning practical light, phone-shot intimacy";

  const shots: PlannedShot[] = beats.map((beat, i) => {
    const durationMs = durations[i] ?? 4000;
    const quoted = beat.match(/[“"]([^”"]+)[”"]/);
    const line = quoted?.[1];
    return {
      index: i + 1,
      title: `Shot ${i + 1}`,
      durationMs,
      camera:
        i === 0
          ? "wide establishing"
          : i === beats.length - 1
            ? "hero close-up hold"
            : i % 2 === 0
              ? "medium, handheld"
              : "insert / detail",
      action: beat,
      dialogue: line ? line : null,
      visualPrompt: `${look}. ${args.aspect} frame. Same continuity, same person and location unless the line clearly changes scene. ${beat}`,
      negativePrompt: NEGATIVE,
    };
  });

  const first = beats[0] ?? args.prompt;
  const title =
    first
      .split(/\s+/)
      .slice(0, 7)
      .join(" ")
      .replace(/[.,;:]+$/, "") || "Untitled board";
  return {
    title,
    logline: first,
    styleBible: {
      look,
      palette: "warm practicals, muted shadows, one accent color",
      camera: "consistent lens language, limited coverage",
      references: [args.tone, args.aspect],
    },
    beats: shots.map((shot) => ({
      t: `${Math.round(shot.durationMs / 1000)}s`,
      summary: shot.action,
    })),
    shots,
  };
}

export function normalizeBoard(
  raw: BoardResult,
  targetDurationMs: number,
): BoardResult {
  const shots = raw.shots.slice(0, 8).map((shot, i) => ({
    ...shot,
    index: i + 1,
    durationMs: Math.max(1500, Math.min(8000, Math.round(shot.durationMs))),
    dialogue: shot.dialogue && shot.dialogue.trim() ? shot.dialogue : null,
    negativePrompt: shot.negativePrompt || NEGATIVE,
  }));
  if (shots.length < 4) {
    return fallbackBoard({
      prompt: raw.logline || raw.title,
      targetDurationMs,
      aspect: "9:16",
      tone: raw.styleBible.look,
    });
  }
  const sum = shots.reduce((acc, shot) => acc + shot.durationMs, 0);
  if (sum === 0) {
    return fallbackBoard({
      prompt: raw.logline,
      targetDurationMs,
      aspect: "9:16",
      tone: raw.styleBible.look,
    });
  }
  const scaled = shots.map((shot) => ({
    ...shot,
    durationMs: Math.max(
      1500,
      Math.round((shot.durationMs / sum) * targetDurationMs),
    ),
  }));
  const drift =
    targetDurationMs - scaled.reduce((acc, shot) => acc + shot.durationMs, 0);
  const last = scaled[scaled.length - 1];
  if (last) {
    last.durationMs = Math.max(1500, last.durationMs + drift);
  }
  return { ...raw, shots: scaled };
}
