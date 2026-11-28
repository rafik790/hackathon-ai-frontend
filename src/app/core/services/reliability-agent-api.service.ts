import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppEnvironment } from '../../../environments/environment.model';
import { APP_CONFIG, joinUrl } from '../config/app-config';
import { PageResponse } from '../models/execution.models';
import {
  ConversationDetail,
  ConversationSummary,
  MessageAccepted,
  ReliabilityAgentStatus,
} from '../models/reliability-agent.models';
import { toHttpParams } from '../utils/http-params.util';

/** /api/v1/reliability-agent: ask the interactive reliability agent and read its conversations. */
@Injectable({ providedIn: 'root' })
export class ReliabilityAgentApiService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.baseUrl = joinUrl(config.apiBaseUrl, 'reliability-agent');
  }

  /** Always answers, also while the feature is disabled (enabled: false). */
  status(): Observable<ReliabilityAgentStatus> {
    return this.http.get<ReliabilityAgentStatus>(joinUrl(this.baseUrl, 'status'));
  }

  /** Starts a conversation; 202 with the queued question. 400 invalid question, 409 disabled, 429 AI quota exhausted. */
  start(question: string): Observable<MessageAccepted> {
    return this.http.post<MessageAccepted>(joinUrl(this.baseUrl, 'conversations'), { question });
  }

  /** 409 while the previous question of the conversation is still being answered. */
  followUp(conversationId: number, question: string): Observable<MessageAccepted> {
    return this.http.post<MessageAccepted>(joinUrl(this.baseUrl, `conversations/${conversationId}/messages`), { question });
  }

  /** Most recently updated first. */
  list(size = 20): Observable<PageResponse<ConversationSummary>> {
    return this.http.get<PageResponse<ConversationSummary>>(joinUrl(this.baseUrl, 'conversations'), {
      params: toHttpParams({ page: 0, size, sort: 'updatedAt,desc' }),
    });
  }

  /** With every question, answer and tool call. */
  get(conversationId: number): Observable<ConversationDetail> {
    return this.http.get<ConversationDetail>(joinUrl(this.baseUrl, `conversations/${conversationId}`));
  }
}
