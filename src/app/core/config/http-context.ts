import { HttpContextToken } from '@angular/common/http';

/** When set, HttpErrorInterceptor passes the raw HttpErrorResponse through untouched. */
export const RAW_HTTP_ERRORS = new HttpContextToken<boolean>(() => false);
