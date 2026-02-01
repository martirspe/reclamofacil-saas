import { inject } from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

let refreshRequest$: ReturnType<HttpClient['post']> | null = null;

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const backend = inject(HttpBackend);
  const http = new HttpClient(backend);

  if (req.url.includes('/api/public/login') || req.url.includes('/api/public/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = auth.getRefreshToken();
      if (!refreshToken) {
        auth.clearSession();
        return throwError(() => error);
      }

      if (!refreshRequest$) {
        const tenantSlug = auth.getTenantSlug();
        refreshRequest$ = http
          .post(`${environment.API_URL}/api/public/refresh`, { refresh_token: refreshToken }, { headers: tenantSlug ? { 'x-tenant': tenantSlug } : undefined })
          .pipe(shareReplay(1));
      }

      return refreshRequest$.pipe(
        switchMap((response: any) => {
          refreshRequest$ = null;
          const accessToken = response?.access_token;
          const newRefreshToken = response?.refresh_token;
          const user = response?.user;
          const tenantSlug = response?.tenant_slug || auth.getTenantSlug();
          if (!accessToken || !newRefreshToken) {
            auth.clearSession();
            return throwError(() => error);
          }
          auth.applySession(accessToken, newRefreshToken, user, tenantSlug || null);
          const cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${accessToken}`,
              ...(tenantSlug ? { 'x-tenant': tenantSlug } : {})
            }
          });
          return next(cloned);
        }),
        catchError((refreshError) => {
          refreshRequest$ = null;
          auth.clearSession();
          return throwError(() => refreshError);
        })
      );
    })
  );
};

