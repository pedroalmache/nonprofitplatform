import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountApi } from './account-api';

export const signedInGuard: CanActivateFn = () => {
  const account = inject(AccountApi);
  if (account.token()) {
    return true;
  }

  return inject(Router).createUrlTree(['/login']);
};
