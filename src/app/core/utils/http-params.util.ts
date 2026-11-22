import { HttpParams } from '@angular/common/http';

export type QueryValue = string | number | boolean | null | undefined;

/** Builds HttpParams, dropping null, undefined and blank values so the backend applies its defaults. */
export function toHttpParams(values: Readonly<Record<string, QueryValue>>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) {
      continue;
    }
    const text = String(value).trim();
    if (text.length > 0) {
      params = params.set(key, text);
    }
  }
  return params;
}
