import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data?.['roles'] as string[] | undefined) || [];

  if (!roles.length) {
    return true;
  }

  const user = auth.user();
  if (!user?.role) {
    return router.createUrlTree(['/dashboard']);
  }

  return roles.includes(user.role) ? true : router.createUrlTree(['/dashboard']);
};
