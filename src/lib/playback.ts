export const MAX_SLIDE_MS = 2200;

export function slideDurationMs(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return MAX_SLIDE_MS;
  }
  return Math.min(durationMs, MAX_SLIDE_MS);
}

export function nextCursor(cursor: number, length: number): {
  cursor: number;
  done: boolean;
} {
  if (length <= 0) {
    return { cursor: 0, done: true };
  }
  if (cursor + 1 >= length) {
    return { cursor: 0, done: true };
  }
  return { cursor: cursor + 1, done: false };
}
