/** Body returned by the backend for every 4xx/5xx (com.hackathon.agent.dto.ErrorResponse). */
export interface BackendErrorResponse {
  readonly timestamp: string;
  readonly status: number;
  readonly error: string;
  readonly message: string;
  readonly path: string;
  readonly fieldErrors: readonly { readonly field: string; readonly message: string }[];
}

/** Normalized error produced by HttpErrorInterceptor and consumed by the UI. */
export interface ApiError {
  /** HTTP status; 0 when the server could not be reached. */
  readonly status: number;
  readonly title: string;
  readonly message: string;
  readonly path: string | null;
  readonly fieldErrors: readonly { readonly field: string; readonly message: string }[];
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'title' in value &&
    'message' in value &&
    'fieldErrors' in value
  );
}
