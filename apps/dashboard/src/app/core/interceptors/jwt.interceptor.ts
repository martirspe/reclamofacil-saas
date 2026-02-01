import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const tenantSlug = auth.getTenantSlug();
  if (!token && !tenantSlug) {
    return next(req);
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantSlug) {
    headers['x-tenant'] = tenantSlug;
  }
  return next(req.clone({ setHeaders: headers }));
};
