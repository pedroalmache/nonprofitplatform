import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { apiUrl } from '../api-url';
import { accessTokenStorageKey } from './account-api';
import { SessionRefresh } from './session-refresh';

const refreshRetried = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiRoot = `${apiUrl.replace(/\/$/, '')}/api/`;
  if (!request.url.startsWith(apiRoot)) {
    return next(request);
  }

  const session = inject(SessionRefresh);
  const authenticated = withAccessToken(request);
  return next(authenticated).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (authenticated.context.get(refreshRetried)) {
        session.signOut();
        return throwError(() => error);
      }

      if (!shouldRefresh(authenticated)) {
        return throwError(() => error);
      }

      return session.refresh().pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            return throwError(() => error);
          }

          const retry = withAccessToken(authenticated).clone({
            context: authenticated.context.set(refreshRetried, true),
          });
          return next(retry);
        }),
      );
    }),
  );
};

function shouldRefresh(request: HttpRequest<unknown>): boolean {
  if (!request.headers.has('Authorization')) {
    return false;
  }

  return (
    !request.url.endsWith('/api/account/login') && !request.url.endsWith('/api/account/refresh')
  );
}

function withAccessToken(request: HttpRequest<unknown>): HttpRequest<unknown> {
  const token = localStorage.getItem(accessTokenStorageKey);
  if (!token) {
    return request;
  }

  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}
