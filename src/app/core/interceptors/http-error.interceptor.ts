import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiError, BackendErrorResponse } from '../models/api-error.model';
import { RAW_HTTP_ERRORS } from '../config/http-context';

/** Converts every HttpErrorResponse into an ApiError, using the backend's ErrorResponse body when present. */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.context.get(RAW_HTTP_ERRORS)) {
      return next.handle(request);
    }
    return next.handle(request).pipe(
      catchError((error: unknown) => throwError(() => (error instanceof HttpErrorResponse ? toApiError(error) : error))),
    );
  }
}

export function toApiError(error: HttpErrorResponse): ApiError {
  // 0: network failure. 502/504 without a backend body: the proxy (Nginx / Ingress) could not reach the agent.
  const proxyFailure = (error.status === 502 || error.status === 504) && !isBackendError(error.error);
  if (error.status === 0 || proxyFailure) {
    return {
      status: 0,
      title: 'Backend unreachable',
      message: 'The CI/CD Reliability Agent API could not be reached. Check that the backend is running and reachable.',
      path: error.url,
      fieldErrors: [],
    };
  }
  const body: unknown = error.error;
  if (isBackendError(body)) {
    return {
      status: body.status,
      title: body.error || defaultTitle(error.status),
      message: body.message || error.message,
      path: body.path ?? error.url,
      fieldErrors: body.fieldErrors ?? [],
    };
  }
  return {
    status: error.status,
    title: defaultTitle(error.status),
    message: error.status === 404 ? 'The requested resource does not exist.' : error.statusText || error.message,
    path: error.url,
    fieldErrors: [],
  };
}

function isBackendError(body: unknown): body is BackendErrorResponse {
  return typeof body === 'object' && body !== null && 'status' in body && 'message' in body;
}

function defaultTitle(status: number): string {
  if (status === 400) return 'Invalid request';
  if (status === 404) return 'Not found';
  if (status === 503) return 'Service unavailable';
  if (status >= 500) return 'Server error';
  return `Request failed (${status})`;
}
