import { useEffect, useMemo, useRef, useState } from "react";
import { formatMs } from "../lib/format";

type PlayableShot = {
  _id: string;
  index: number;
  title: string;
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
}: {
  shots: PlayableShot[];
  aspect: "9:16" | "16:9" | "1:1";
  onSkip: (count: number) => void;
}) {
  const playable = useMemo(
    () => shots.filter((shot) => shot.stillUrl || shot.clipUrl),
    [shots],
  );
  const skipped = shots.length - playable.length;
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const current = playable[cursor];

  useEffect(() => {
    if (!playing || !current) return;
    const audio = audioRef.current;
    if (audio && current.audioUrl) {
      void audio.play().catch(() => undefined);
    } else if (current.dialogue && "speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(current.dialogue);
      utter.rate = 0.96;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
    const timer = window.setTimeout(() => {
      if (cursor + 1 >= playable.length) {
        setPlaying(false);
        setCursor(0);
        return;
      }
      setCursor((value) => value + 1);
    }, current.durationMs);
    return () => {
      window.clearTimeout(timer);
      window.speechSynthesis?.cancel();
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [playing, cursor, current, playable.length]);

  const frame =
    aspect === "16:9"
      ? "aspect-video max-w-4xl"
      : aspect === "1:1"
        ? "aspect-square max-w-xl"
        : "aspect-[9/16] max-w-sm";

  return (
    <section className="border-b border-white/10 px-6 py-6">
      <div className={`mx-auto overflow-hidden rounded-3xl bg-black ${frame}`}>
        {current?.clipUrl && playing ? (
          <video
            src={current.clipUrl}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : current?.stillUrl ? (
          <img
            src={current.stillUrl}
            alt={current.title}
            className={`h-full w-full object-cover ${playing ? "kenburns" : ""}`}
            style={
              playing
                ? { animationDuration: `${current.durationMs}ms` }
                : undefined
            }
          />
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center text-paper/40">
            Waiting for the first still…
          </div>
        )}
      </div>
      {current?.audioUrl ? (
        <audio ref={audioRef} src={current.audioUrl} />
      ) : (
        <audio ref={audioRef} />
      )}
      <div className="mx-auto mt-4 flex max-w-4xl items-center justify-between gap-4">
        <button
          type="button"
          className="rounded-full bg-clay px-5 py-2 text-sm font-semibold text-ink"
          onClick={() => {
            if (skipped > 0) onSkip(skipped);
            setCursor(0);
            setPlaying(true);
          }}
          disabled={playable.length === 0}
        >
          Watch the cut
        </button>
        <p className="text-sm text-paper/55">
          {current
            ? `${String(current.index).padStart(2, "0")} ${current.title} · ${formatMs(current.durationMs)}`
            : "No playable shots yet"}
        </p>
      </div>
    </section>
  );
}
