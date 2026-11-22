import { Subject, throwError, of } from 'rxjs';
import { ApiError } from './api-error.model';
import { LoadState, loadOnTrigger } from './load-state';

describe('loadOnTrigger', () => {
  const apiError: ApiError = { status: 503, title: 'Service unavailable', message: 'db down', path: null, fieldErrors: [] };

  it('emits loading, then data, and keeps data while a refresh is loading', () => {
    const trigger = new Subject<number>();
    const states: LoadState<string>[] = [];
    const responses = new Map<number, Subject<string>>([
      [1, new Subject<string>()],
      [2, new Subject<string>()],
    ]);

    loadOnTrigger(trigger, (n) => responses.get(n)!).subscribe((s) => states.push(s));

    trigger.next(1);
    responses.get(1)!.next('first');
    trigger.next(2);

    expect(states[0]).toEqual({ loading: true, data: null, error: null });
    expect(states[1]).toEqual({ loading: false, data: 'first', error: null });
    expect(states[2]).toEqual({ loading: true, data: 'first', error: null });
  });

  it('keeps the previous data when a later load fails', () => {
    const trigger = new Subject<boolean>();
    const states: LoadState<string>[] = [];

    loadOnTrigger(trigger, (fail) => (fail ? throwError(() => apiError) : of('ok'))).subscribe((s) => states.push(s));
    trigger.next(false);
    trigger.next(true);

    const last = states[states.length - 1];
    expect(last.data).toBe('ok');
    expect(last.error).toEqual(apiError);
    expect(last.loading).toBeFalse();
  });

  it('cancels a stale request when a new trigger arrives', () => {
    const trigger = new Subject<number>();
    const slow = new Subject<string>();
    const states: LoadState<string>[] = [];

    loadOnTrigger(trigger, (n) => (n === 1 ? slow : of('fresh'))).subscribe((s) => states.push(s));
    trigger.next(1);
    trigger.next(2);
    slow.next('stale');

    expect(states[states.length - 1].data).toBe('fresh');
    expect(slow.observed).toBeFalse();
  });
});
