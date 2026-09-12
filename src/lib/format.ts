export function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)}s`;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "queued":
      return "queued";
    case "generating_still":
      return "still…";
    case "still_ready":
      return "still ready";
    case "generating_audio":
      return "VO…";
    case "audio_ready":
      return "VO ready";
    case "generating_motion":
      return "motion…";
    case "complete":
      return "complete";
    case "failed":
      return "failed";
    default:
      return status;
  }
}
