import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { AppEnvironment } from '../../../environments/environment.model';
import { APP_CONFIG, joinUrl } from '../config/app-config';
import { RAW_HTTP_ERRORS } from '../config/http-context';
import { toApiError } from '../interceptors/http-error.interceptor';
import { ApplicationHealth, ApplicationInfo } from '../models/monitoring.models';

/** Spring Boot Actuator: GET /actuator/health and /actuator/info. */
@Injectable({ providedIn: 'root' })
export class AppInfoApiService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.baseUrl = config.actuatorBaseUrl;
  }

  /** Actuator answers 503 with a full health body when the application is DOWN; treat it as data. */
  health(): Observable<ApplicationHealth> {
    return this.http
      .get<ApplicationHealth>(joinUrl(this.baseUrl, 'health'), {
        context: new HttpContext().set(RAW_HTTP_ERRORS, true),
      })
      .pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 503 && isHealthBody(error.error)) {
            return of(error.error);
          }
          return throwError(() => (error instanceof HttpErrorResponse ? toApiError(error) : error));
        }),
      );
  }

  info(): Observable<ApplicationInfo> {
    return this.http.get<ApplicationInfo>(joinUrl(this.baseUrl, 'info'));
  }
}

function isHealthBody(body: unknown): body is ApplicationHealth {
  return typeof body === 'object' && body !== null && 'status' in body;
}
