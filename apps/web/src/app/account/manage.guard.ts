import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AccountApi, hasManageAccess } from './account-api';

export const manageGuard: CanActivateFn = () => {
  const account = inject(AccountApi);
  const router = inject(Router);
  if (!account.token()) {
    return router.createUrlTree(['/login']);
  }

  return account.me().pipe(
    map((session) => (hasManageAccess(session.roles ?? []) ? true : router.createUrlTree(['/']))),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        account.clearToken();
        return of(router.createUrlTree(['/']));
      }

      return of(router.createUrlTree(['/login']));
    }),
  );
};
