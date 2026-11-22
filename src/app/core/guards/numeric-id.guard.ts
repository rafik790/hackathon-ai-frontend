import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

/**
 * Backend ids are numeric (`/{id}` is a long). Invalid ids redirect to the route's
 * `data.invalidIdRedirect` (or the root) instead of producing a 400 from the API.
 */
export const numericIdGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const id = route.paramMap.get('id');
  if (id !== null && /^\d{1,18}$/.test(id)) {
    return true;
  }
  const redirect: unknown = route.data['invalidIdRedirect'];
  return inject(Router).parseUrl(typeof redirect === 'string' ? redirect : '/');
};
