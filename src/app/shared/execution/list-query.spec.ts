import { convertToParamMap } from '@angular/router';
import { dateBounds, listQueryToParams, parseListQuery, withFilter, withSort } from './list-query';

type Sort = 'startTime' | 'durationMs';
const KEYS = { search: 'pipelineName' };
const SORTABLE: readonly Sort[] = ['startTime', 'durationMs'];

describe('list query state', () => {
  it('parses valid query params and ignores invalid ones', () => {
    const state = parseListQuery<Sort>(
      convertToParamMap({ pipelineName: 'build', status: 'failed', page: '3', size: '500', sort: 'secret', dir: 'asc', from: 'bad' }),
      KEYS,
      SORTABLE,
      'startTime',
    );
    expect(state.search).toBe('build');
    expect(state.status).toBe('FAILED');
    expect(state.page).toBe(3);
    expect(state.size).toBe(100); // backend cap
    expect(state.sort).toBe('startTime'); // not in the allow-list
    expect(state.direction).toBe('asc');
    expect(state.fromDate).toBeNull();
  });

  it('round-trips through query params, omitting defaults', () => {
    const state = parseListQuery<Sort>(convertToParamMap({ status: 'running' }), KEYS, SORTABLE, 'startTime');
    expect(listQueryToParams(state, KEYS, 'startTime')).toEqual({
      pipelineName: null,
      status: 'running',
      namespace: null,
      from: null,
      to: null,
      page: null,
      size: null,
      sort: null,
      dir: null,
    });
  });

  it('resets to the first page when filters or sort change', () => {
    const state = { ...parseListQuery<Sort>(convertToParamMap({ page: '4' }), KEYS, SORTABLE, 'startTime') };
    expect(withFilter(state, { search: 'x', secondarySearch: '', status: null, namespace: 'ci', from: null, to: null }).page).toBe(0);
    expect(withSort(state, { active: 'durationMs', direction: 'asc' }, SORTABLE)).toEqual(
      jasmine.objectContaining({ page: 0, sort: 'durationMs', direction: 'asc' }),
    );
    expect(withSort(state, { active: 'hacked', direction: 'asc' }, SORTABLE)).toBe(state);
  });

  it('turns a calendar range into an inclusive start and exclusive end instant', () => {
    const { from, to } = dateBounds({ fromDate: '2026-11-01', toDate: '2026-11-03' });
    expect(new Date(from!).getDate()).toBe(1);
    expect(new Date(to!).getDate()).toBe(4);
    expect(new Date(to!).getHours()).toBe(0);
  });
});
