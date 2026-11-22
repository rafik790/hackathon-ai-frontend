import { elapsedSince, formatDuration } from './duration';

describe('formatDuration', () => {
  it('formats each magnitude compactly', () => {
    expect(formatDuration(850)).toBe('850ms');
    expect(formatDuration(42_000)).toBe('42s');
    expect(formatDuration(195_000)).toBe('3m 15s');
    expect(formatDuration(2 * 3600_000 + 5 * 60_000)).toBe('2h 05m');
    expect(formatDuration(3 * 86400_000 + 4 * 3600_000)).toBe('3d 4h');
  });

  it('renders a dash for missing or invalid values', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(undefined)).toBe('—');
    expect(formatDuration(-1)).toBe('—');
  });
});

describe('elapsedSince', () => {
  it('measures from an ISO timestamp', () => {
    expect(elapsedSince('2026-11-21T10:00:00Z', Date.parse('2026-11-21T10:01:00Z'))).toBe(60_000);
    expect(elapsedSince(null)).toBeNull();
    expect(elapsedSince('not-a-date')).toBeNull();
  });
});
