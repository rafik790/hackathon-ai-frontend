import { topCounts } from './failure-analysis.service';

describe('topCounts', () => {
  it('ranks values by frequency, breaking ties alphabetically, and limits the result', () => {
    const result = topCounts(['b', 'a', 'b', 'c', 'a', 'b', 'd'], 3);
    expect(result).toEqual([
      { label: 'b', value: 3 },
      { label: 'a', value: 2 },
      { label: 'c', value: 1 },
    ]);
  });

  it('returns an empty list for no failures', () => {
    expect(topCounts([])).toEqual([]);
  });
});
