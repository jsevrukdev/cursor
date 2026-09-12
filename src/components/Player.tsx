import { useEffect, useRef, useState } from "react";
import { formatMs } from "../lib/format";
import { nextCursor, slideDurationMs } from "../lib/playback";

export type PlayableShot = {
  _id: string;
  index: number;
  title: string;
  action: string;
  durationMs: number;
  stillUrl: string | null;
  audioUrl: string | null;
  clipUrl: string | null;
  dialogue?: string;
  status: string;
};

export default function Player({
  shots,
  aspect,
  onSkip,
  onIndexChange,
}: {
  shots: PlayableShot[];
  aspect: "9:16" | "16:9" | "1:1";
  onSkip: (count: number) => void;
  onIndexChange?: (index: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const shotsRef = useRef(shots);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  shotsRef.current = shots;

  const current = shots[cursor] ?? shots[0];
  const missingStills = shots.filter((shot) => !shot.stillUrl && !shot.clipUrl).length;

  useEffect(() => {
    onIndexChange?.(cursor);
  }, [cursor, onIndexChange]);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    if (shotsRef.current.length === 0) {
      setPlaying(false);
      return undefined;
    }

    let cancelled = false;
    let timer = 0;
    const audio = audioRef.current;
    setCursor(0);

    const queue = (index: number) => {
      const shot = shotsRef.current[index];
      if (!shot) {
        setPlaying(false);
        return;
      }
      if (audio && shot.audioUrl) {
        audio.src = shot.audioUrl;
        void audio.play().catch(() => undefined);
      } else if (shot.dialogue && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(shot.dialogue);
        utter.rate = 0.96;
        window.speechSynthesis.speak(utter);
      }
      timer = window.setTimeout(() => {
        if (cancelled) return;
        const next = nextCursor(index, shotsRef.current.length);
        if (next.done) {
          setPlaying(false);
          setCursor(0);
          return;
        }
        setCursor(next.cursor);
        queue(next.cursor);
      }, slideDurationMs(shot.durationMs));
    };

    queue(0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.speechSynthesis?.cancel();
      audio?.pause();
    };
  }, [playing]);

  const frame =
    aspect === "16:9"
      ? "aspect-video max-w-4xl"
      : aspect === "1:1"
        ? "aspect-square max-w-xl"
        : "aspect-[9/16] max-w-sm";

  function startCut() {
    if (shots.length === 0) return;
    if (missingStills > 0) onSkip(missingStills);
    window.speechSynthesis?.cancel();
    setCursor(0);
    setPlaying(true);
  }

  function stopCut() {
    setPlaying(false);
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
  }

  return (
    <section className="border-b border-white/10 px-6 py-6">
      <div className={`relative mx-auto overflow-hidden rounded-3xl bg-black ${frame}`}>
        {current?.clipUrl && playing ? (
          <video
            key={current._id}
            src={current.clipUrl}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : current?.stillUrl ? (
          <img
            key={current._id}
            src={current.stillUrl}
            alt={current.title}
            className={`h-full w-full object-cover ${playing ? "kenburns" : ""}`}
            style={
              playing
                ? { animationDuration: `${slideDurationMs(current.durationMs)}ms` }
                : undefined
            }
          />
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center p-6 text-center text-paper/70">
            {current?.action ?? "Waiting for shots…"}
          </div>
        )}
        {current ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-xs uppercase tracking-widest text-clay">
              Shot {String(current.index).padStart(2, "0")} / {shots.length}
              {playing ? " · playing" : ""}
            </p>
            <p className="font-display text-lg leading-snug">{current.title}</p>
            <p className="line-clamp-3 text-sm text-paper/80">{current.action}</p>
          </div>
        ) : null}
      </div>
      <audio ref={audioRef} />
      <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-ink disabled:opacity-40"
          onClick={() => (playing ? stopCut() : startCut())}
          disabled={shots.length === 0}
        >
          {playing ? "Stop" : "Play cut"}
        </button>
        <p className="text-sm text-paper/55">
          {current
            ? `${current.title} · ${formatMs(slideDurationMs(current.durationMs))} on screen`
            : "No shots yet"}
        </p>
      </div>
      {shots.length > 1 ? (
        <div className="mx-auto mt-3 flex max-w-4xl justify-center gap-1">
          {shots.map((shot, index) => (
            <span
              key={shot._id}
              className={`h-1.5 w-8 rounded-full ${
                index === cursor ? "bg-clay" : "bg-white/20"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
