import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppEnvironment } from '../../../environments/environment.model';
import { APP_CONFIG, joinUrl } from '../config/app-config';
import { CollectorStatus } from '../models/monitoring.models';

/** GET /api/v1/collector/status */
@Injectable({ providedIn: 'root' })
export class CollectorApiService {
  private readonly url: string;

  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.url = joinUrl(config.apiBaseUrl, 'collector/status');
  }

  status(): Observable<CollectorStatus> {
    return this.http.get<CollectorStatus>(this.url);
  }
}
