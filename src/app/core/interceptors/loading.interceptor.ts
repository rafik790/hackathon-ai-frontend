import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/** Drives the global progress bar and the "last refreshed" timestamp. */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private readonly loading: LoadingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.loading.start();
    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.loading.markSuccess();
        }
      }),
      finalize(() => this.loading.stop()),
    );
  }
}
