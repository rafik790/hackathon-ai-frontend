import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '../models/api-error.model';
import { HttpErrorInterceptor, toApiError } from './http-error.interceptor';

describe('HttpErrorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('maps the backend ErrorResponse body', () => {
    let error: ApiError | undefined;
    http.get('api/v1/dashboard/summary').subscribe({ error: (e: ApiError) => (error = e) });

    controller.expectOne('api/v1/dashboard/summary').flush(
      {
        timestamp: '2026-11-21T10:15:30Z',
        status: 400,
        error: 'Bad Request',
        message: "'from' must be before 'to'",
        path: '/api/v1/dashboard/summary',
        fieldErrors: [{ field: 'from', message: 'invalid' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(error?.status).toBe(400);
    expect(error?.title).toBe('Bad Request');
    expect(error?.message).toBe("'from' must be before 'to'");
    expect(error?.fieldErrors.length).toBe(1);
  });

  it('reports an unreachable backend for status 0', () => {
    const mapped = toApiError(new HttpErrorResponse({ status: 0, url: 'api/v1/tasks' }));
    expect(mapped.status).toBe(0);
    expect(mapped.title).toBe('Backend unreachable');
  });

  it('treats a proxy 502/504 without a backend body as unreachable', () => {
    expect(toApiError(new HttpErrorResponse({ status: 504, url: 'api/v1/tasks' })).title).toBe('Backend unreachable');
  });

  it('falls back to a generic message without a backend body', () => {
    const mapped = toApiError(new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error', url: 'api/v1/tasks' }));
    expect(mapped.title).toBe('Server error');
    expect(mapped.message).toBe('Internal Server Error');
  });
});
