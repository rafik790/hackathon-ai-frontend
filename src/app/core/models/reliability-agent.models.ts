/**
 * Mirrors the backend DTOs of the interactive reliability agent (com.hackathon.agent.reliability.api.ReliabilityAgentDtos
 * and com.hackathon.agent.reliability.model.ReliabilityModel).
 */

/** PENDING = queued, RUNNING = the agent is working; COMPLETED and FAILED are final. */
export type AgentMessageStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
/** SUCCEEDED/FAILED: the tool ran; REJECTED: the backend refused the request. */
export type AgentToolCallStatus = 'SUCCEEDED' | 'FAILED' | 'REJECTED';
export type AgentReferenceType = 'PIPELINE_RUN' | 'TASK_RUN' | 'FAILURE_PATTERN_ANALYSIS';

export interface AgentToolInfo {
  readonly name: string;
  readonly activity: string;
  readonly description: string;
}

export interface ReliabilityAgentStatus {
  /** INTERACTIVE_RELIABILITY_AGENT_ENABLED */
  readonly enabled: boolean;
  /** Questions can be answered: enabled, AI enabled, provider with tool use. */
  readonly available: boolean;
  readonly reason: string | null;
  readonly tools: readonly AgentToolInfo[];
  readonly limits: Readonly<Record<string, number>>;
}

export interface MessageAccepted {
  readonly conversationId: number;
  readonly messageId: number;
  readonly status: AgentMessageStatus;
}

/** A run or analysis a tool returned; never taken from the model's text. */
export interface AgentReference {
  readonly type: AgentReferenceType;
  readonly id: number | null;
  readonly name: string;
  readonly namespace: string | null;
}

export interface AgentFact {
  readonly statement: string;
  /** Numbers of the successful tool calls that returned it. */
  readonly toolCalls: readonly number[];
}

export interface ReliabilityAnswer {
  readonly answer: string;
  readonly facts: readonly AgentFact[];
  readonly conclusions: readonly string[];
  readonly recommendations: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly references: readonly AgentReference[];
}

export interface AgentToolCall {
  readonly id: number;
  readonly messageId: number;
  /** Tool call number, cited by facts. */
  readonly sequence: number;
  readonly toolName: string;
  readonly activity: string | null;
  /** Names and filters only; redacted by the backend. */
  readonly arguments: Readonly<Record<string, unknown>> | null;
  readonly status: AgentToolCallStatus;
  /** Redacted, bounded result; log text is never stored. */
  readonly resultSummary: string | null;
  readonly errorMessage: string | null;
  readonly durationMs: number | null;
  readonly createdAt: string;
}

export interface AgentMessage {
  readonly id: number;
  readonly conversationId: number;
  readonly sequence: number;
  readonly question: string;
  readonly status: AgentMessageStatus;
  readonly answer: ReliabilityAnswer | null;
  readonly errorMessage: string | null;
  readonly iterations: number;
  readonly toolCallCount: number;
  readonly durationMs: number | null;
  readonly provider: string | null;
  readonly model: string | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly toolCalls: readonly AgentToolCall[];
}

export interface ConversationSummary {
  readonly id: number;
  readonly title: string;
  /** Status of the latest question. */
  readonly status: AgentMessageStatus | null;
  readonly messageCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  readonly messages: readonly AgentMessage[];
}

export function isAgentMessageActive(status: AgentMessageStatus | null | undefined): boolean {
  return status === 'PENDING' || status === 'RUNNING';
}
