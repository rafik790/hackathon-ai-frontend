import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { numericIdGuard } from './numeric-id.guard';

describe('numericIdGuard', () => {
  const run = (id: string): boolean | UrlTree => {
    const route = { paramMap: convertToParamMap({ id }), data: { invalidIdRedirect: '/pipeline-runs' } } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => numericIdGuard(route, {} as RouterStateSnapshot)) as boolean | UrlTree;
  };

  beforeEach(() => TestBed.configureTestingModule({ imports: [RouterTestingModule] }));

  it('allows numeric ids', () => {
    expect(run('42')).toBeTrue();
  });

  it('redirects non-numeric ids to the configured list', () => {
    const result = run('abc');
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/pipeline-runs');
  });
});
