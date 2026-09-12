import { useState, type ReactNode } from "react";
import { useAction } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { ASPECTS, DURATIONS, SEED_PROMPT, TONES } from "../lib/seed";

export default function Home() {
  const boardStory = useAction(api.actions.boardStory);
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(SEED_PROMPT);
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("9:16");
  const [tone, setTone] = useState<(typeof TONES)[number]>("UGC");
  const [durationMs, setDurationMs] = useState<(typeof DURATIONS)[number]>(30000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onBoard() {
    setBusy(true);
    setError(null);
    try {
      const projectId = await boardStory({
        sourcePrompt: prompt,
        aspect,
        tone,
        targetDurationMs: durationMs,
      });
      navigate(`/p/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not board this story");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-xs tracking-[0.25em] text-clay uppercase">Shotline</p>
        <h1 className="font-display text-4xl leading-tight text-paper md:text-5xl">
          Type a 30-second story. Get a playable cut.
        </h1>
        <p className="max-w-xl text-paper/75">
          Shot list, stills, VO, and a shareable board — live as assets land. Wispr Flow
          stays in your editor, not in this product.
        </p>
      </header>

      <label className="block space-y-2">
        <span className="text-sm text-paper/60">Story</span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={9}
          className="w-full resize-y rounded-2xl border border-white/10 bg-white/5 p-4 text-base leading-relaxed text-paper outline-none ring-clay/40 focus:ring-2"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Length">
          {DURATIONS.map((ms) => (
            <Chip
              key={ms}
              active={durationMs === ms}
              onClick={() => setDurationMs(ms)}
            >
              {ms / 1000}s
            </Chip>
          ))}
        </Field>
        <Field label="Aspect">
          {ASPECTS.map((value) => (
            <Chip key={value} active={aspect === value} onClick={() => setAspect(value)}>
              {value}
            </Chip>
          ))}
        </Field>
        <Field label="Tone">
          {TONES.map((value) => (
            <Chip key={value} active={tone === value} onClick={() => setTone(value)}>
              {value}
            </Chip>
          ))}
        </Field>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="button"
        onClick={() => void onBoard()}
        disabled={busy}
        className="rounded-full bg-clay px-8 py-3 text-sm font-semibold tracking-wide text-ink disabled:opacity-50"
      >
        {busy ? "Boarding…" : "Board it"}
      </button>

      <p className="mt-auto pt-8 text-xs text-paper/40">
        x.ai structures the board. Fal generates media when keys are set. Convex keeps the
        timeline live. Vercel ships the URL. Placeholder stills run without API keys.
      </p>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-paper/60">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm ${
        active ? "bg-paper text-ink" : "bg-white/10 text-paper/80"
      }`}
    >
      {children}
    </button>
  );
}
