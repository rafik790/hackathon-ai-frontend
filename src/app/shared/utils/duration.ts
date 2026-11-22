/** Formats milliseconds as a compact human duration: 850ms, 42s, 3m 15s, 2h 05m, 3d 4h. */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) {
    return '—';
  }
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  const totalSeconds = Math.round(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

/** Milliseconds between an ISO timestamp and `now`, or null when the timestamp is missing or invalid. */
export function elapsedSince(iso: string | null | undefined, now: number = Date.now()): number | null {
  if (!iso) {
    return null;
  }
  const start = Date.parse(iso);
  return Number.isNaN(start) ? null : Math.max(0, now - start);
}
