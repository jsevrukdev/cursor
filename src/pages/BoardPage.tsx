import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatMs, statusLabel } from "../lib/format";
import Player from "../components/Player.tsx";

export default function BoardPage() {
  const { projectId } = useParams();
  const typedId = projectId as Id<"projects"> | undefined;
  const board = useQuery(
    api.projects.getBoard,
    typedId ? { projectId: typedId } : "skip",
  );
  const updateShot = useMutation(api.projects.updateShotCopy);
  const retryShot = useAction(api.actions.retryShot);
  const [selectedId, setSelectedId] = useState<Id<"shots"> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!board) return null;
    return (
      board.shots.find((shot) => shot._id === selectedId) ?? board.shots[0] ?? null
    );
  }, [board, selectedId]);

  if (board === undefined) {
    return <p className="p-10 text-paper/60">Loading board…</p>;
  }
  if (board === null || !typedId) {
    return (
      <main className="p-10">
        <p>Board not found.</p>
        <Link to="/" className="text-clay">
          New story
        </Link>
      </main>
    );
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setToast("Link copied");
    window.setTimeout(() => setToast(null), 1600);
  }

  return (
    <main className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div>
          <Link to="/" className="text-xs tracking-[0.25em] text-clay uppercase">
            Shotline
          </Link>
          <h1 className="font-display text-2xl">{board.title}</h1>
          <p className="text-sm text-paper/55">
            {board.provider === "xai" ? "Boarded by x.ai" : "Local fallback board"} ·{" "}
            {board.status} · {formatMs(board.targetDurationMs)} · {board.aspect}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="rounded-full border border-white/20 px-4 py-2 text-sm"
          >
            Copy link
          </button>
        </div>
      </header>

      <Player shots={board.shots} aspect={board.aspect} onSkip={(n) => setToast(`Skipped ${n} generating shot${n === 1 ? "" : "s"}`)} />

      {board.beats.length > 0 ? (
        <details className="border-b border-white/10 px-6 py-3 text-sm text-paper/70">
          <summary className="cursor-pointer text-paper">Beat sheet</summary>
          <ul className="mt-3 space-y-1">
            {board.beats.map((beat) => (
              <li key={`${beat.t}-${beat.summary}`}>
                <span className="text-clay">{beat.t}</span> {beat.summary}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <section className="flex gap-3 overflow-x-auto px-6 py-5">
        {board.shots.map((shot) => (
          <button
            type="button"
            key={shot._id}
            onClick={() => setSelectedId(shot._id)}
            className={`w-48 shrink-0 overflow-hidden rounded-2xl border text-left ${
              selected?._id === shot._id ? "border-clay" : "border-white/10"
            }`}
          >
            <div className="aspect-[9/16] bg-white/5">
              {shot.stillUrl ? (
                <img
                  src={shot.stillUrl}
                  alt={shot.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-paper/40">
                  {statusLabel(shot.status)}
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="text-xs text-clay">
                {String(shot.index).padStart(2, "0")} · {formatMs(shot.durationMs)}
              </p>
              <p className="line-clamp-2 text-sm">{shot.title}</p>
              <p className="text-xs text-paper/50">{statusLabel(shot.status)}</p>
            </div>
          </button>
        ))}
      </section>

      {selected ? (
        <Inspector
          key={selected._id}
          shot={selected}
          onSave={async (fields) => {
            await updateShot({ shotId: selected._id, ...fields });
          }}
          onRetry={async () => {
            await retryShot({ shotId: selected._id });
          }}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 rounded-full bg-paper px-4 py-2 text-sm text-ink">
          {toast}
        </div>
      ) : null}

      {board.error ? (
        <p className="px-6 pb-8 text-sm text-red-300">{board.error}</p>
      ) : null}
    </main>
  );
}

function Inspector({
  shot,
  onSave,
  onRetry,
}: {
  shot: {
    _id: Id<"shots">;
    title: string;
    camera: string;
    action: string;
    visualPrompt: string;
    dialogue?: string;
    error?: string;
    status: string;
  };
  onSave: (fields: {
    visualPrompt?: string;
    dialogue?: string | null;
    action?: string;
  }) => Promise<void>;
  onRetry: () => Promise<void>;
}) {
  const [visualPrompt, setVisualPrompt] = useState(shot.visualPrompt);
  const [dialogue, setDialogue] = useState(shot.dialogue ?? "");
  const [action, setAction] = useState(shot.action);

  return (
    <section className="grid gap-4 border-t border-white/10 px-6 py-6 md:grid-cols-2">
      <div className="space-y-3">
        <p className="text-xs tracking-widest text-clay uppercase">Inspector</p>
        <h2 className="font-display text-2xl">{shot.title}</h2>
        <p className="text-sm text-paper/60">{shot.camera}</p>
        <label className="block space-y-1 text-sm">
          Action
          <textarea
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3"
            rows={3}
          />
        </label>
        <label className="block space-y-1 text-sm">
          Dialogue
          <input
            value={dialogue}
            onChange={(event) => setDialogue(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3"
          />
        </label>
      </div>
      <div className="space-y-3">
        <label className="block space-y-1 text-sm">
          Visual prompt
          <textarea
            value={visualPrompt}
            onChange={(event) => setVisualPrompt(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3"
            rows={6}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-paper px-4 py-2 text-sm text-ink"
            onClick={() =>
              void onSave({
                visualPrompt,
                action,
                dialogue: dialogue.trim() ? dialogue : null,
              })
            }
          >
            Save copy
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 px-4 py-2 text-sm"
            onClick={() => void onRetry()}
          >
            Regen still
          </button>
        </div>
        {shot.error ? (
          <p className="text-sm text-red-300">
            This shot failed. Retry still. {shot.error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
