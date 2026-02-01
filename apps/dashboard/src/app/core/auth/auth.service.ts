import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

type AuthUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
};

type SafeAuthUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
};

type LoginResponse = {
  message: string;
  access_token: string;
  refresh_token: string;
  user: AuthUser;
  tenant_slug?: string | null;
};

type SignupResponse = {
  message: string;
  userId: number;
  email: string;
  email_verification_required?: boolean;
  next_step?: string;
};

type VerifyEmailResponse = {
  message: string;
  token?: string;
  user?: AuthUser;
  tenant_slug?: string | null;
};

type ResendVerificationResponse = {
  message: string;
  email?: string;
};

type ForgotPasswordResponse = {
  message: string;
};

type ResetPasswordResponse = {
  message: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private storageMode: 'local' | 'session' = this.detectStorageMode();
  private readonly tokenSignal = signal<string | null>(this.getFromStorage('access_token'));
  private readonly refreshTokenSignal = signal<string | null>(this.getFromStorage('refresh_token'));
  private readonly tenantSignal = signal<string | null>(this.getFromStorage('tenant_slug'));
  private readonly userSignal = signal<SafeAuthUser | null>(this.readUser());
  readonly token = computed(() => this.tokenSignal());
  readonly user = computed(() => this.userSignal());
  readonly tenant = computed(() => this.tenantSignal());

  login(email: string, password: string, tenantSlug?: string | null, remember = true): Observable<LoginResponse> {
    const headers = tenantSlug ? { 'x-tenant': tenantSlug } : undefined;
    return this.http
      .post<LoginResponse>(`${environment.API_URL}/api/public/login`, { email, password }, { headers })
      .pipe(
        tap((response) => {
          this.setSession(response.access_token, response.refresh_token, response.user, response.tenant_slug || tenantSlug || null, remember);
        })
      );
  }

  signup(firstName: string, lastName: string, email: string, password: string): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${environment.API_URL}/api/public/signup`, {
      first_name: firstName,
      last_name: lastName,
      email,
      password
    });
  }

  verifyEmail(userId: number, code: string): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(`${environment.API_URL}/api/public/verify-email`, {
      userId,
      code
    });
  }

  resendVerification(userId: number): Observable<ResendVerificationResponse> {
    return this.http.post<ResendVerificationResponse>(`${environment.API_URL}/api/public/resend-verification`, {
      userId
    });
  }

  requestPasswordReset(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${environment.API_URL}/api/public/forgot-password`, {
      email
    });
  }

  resetPassword(userId: number, token: string, password: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${environment.API_URL}/api/public/reset-password`, {
      userId,
      token,
      password
    });
  }

  refreshAccessToken(refreshToken: string, tenantSlug?: string | null): Observable<LoginResponse> {
    const headers = tenantSlug ? { 'x-tenant': tenantSlug } : undefined;
    return this.http
      .post<LoginResponse>(`${environment.API_URL}/api/public/refresh`, { refresh_token: refreshToken }, { headers })
      .pipe(
        tap((response) => {
          this.setSession(response.access_token, response.refresh_token, response.user, response.tenant_slug || tenantSlug || null);
        })
      );
  }

  setToken(token: string) {
    this.tokenSignal.set(token);
    this.setInStorage('access_token', token, this.storageMode === 'local');
  }

  setTenantSlug(slug: string | null) {
    this.tenantSignal.set(slug || null);
    if (slug) {
      this.setInStorage('tenant_slug', slug, this.storageMode === 'local');
    } else {
      this.removeFromStorage('tenant_slug');
    }
  }

  setUser(user: AuthUser | null) {
    const safe = user ? this.toSafeUser(user) : null;
    this.userSignal.set(safe);
    if (safe) {
      this.setInStorage('auth_user', JSON.stringify(safe), this.storageMode === 'local');
    } else {
      this.removeFromStorage('auth_user');
    }
  }

  clearSession() {
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.tenantSignal.set(null);
    this.userSignal.set(null);
    this.removeFromStorage('access_token');
    this.removeFromStorage('refresh_token');
    this.removeFromStorage('tenant_slug');
    this.removeFromStorage('auth_user');
  }

  isAuthenticated(): boolean {
    return !!this.tokenSignal();
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getRefreshToken(): string | null {
    return this.refreshTokenSignal();
  }

  getTenantSlug(): string | null {
    return this.tenantSignal();
  }

  applySession(accessToken: string, refreshToken: string, user: AuthUser, tenantSlug: string | null) {
    this.setSession(accessToken, refreshToken, user, tenantSlug);
  }

  applyVerifiedSession(accessToken: string, user: AuthUser, tenantSlug: string | null, remember = true) {
    const safeUser = this.toSafeUser(user);
    this.storageMode = remember ? 'local' : 'session';
    this.tokenSignal.set(accessToken);
    this.refreshTokenSignal.set(null);
    this.userSignal.set(safeUser);
    this.tenantSignal.set(tenantSlug);
    this.setInStorage('access_token', accessToken, remember);
    this.removeFromStorage('refresh_token');
    if (tenantSlug) {
      this.setInStorage('tenant_slug', tenantSlug, remember);
    } else {
      this.removeFromStorage('tenant_slug');
    }
    this.setInStorage('auth_user', JSON.stringify(safeUser), remember);
  }

  private setSession(token: string, refreshToken: string, user: AuthUser, tenantSlug: string | null, remember = this.storageMode === 'local') {
    const safeUser = this.toSafeUser(user);
    this.storageMode = remember ? 'local' : 'session';
    this.tokenSignal.set(token);
    this.refreshTokenSignal.set(refreshToken);
    this.userSignal.set(safeUser);
    this.tenantSignal.set(tenantSlug);
    this.setInStorage('access_token', token, remember);
    this.setInStorage('refresh_token', refreshToken, remember);
    if (tenantSlug) {
      this.setInStorage('tenant_slug', tenantSlug, remember);
    } else {
      this.removeFromStorage('tenant_slug');
    }
    this.setInStorage('auth_user', JSON.stringify(safeUser), remember);
  }

  private readUser(): SafeAuthUser | null {
    const raw = this.getFromStorage('auth_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SafeAuthUser;
    } catch {
      return null;
    }
  }

  private toSafeUser(user: AuthUser): SafeAuthUser {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    };
  }

  private detectStorageMode(): 'local' | 'session' {
    if (localStorage.getItem('access_token')) {
      return 'local';
    }
    if (sessionStorage.getItem('access_token')) {
      return 'session';
    }
    return 'local';
  }

  private getFromStorage(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }

  private setInStorage(key: string, value: string, remember: boolean) {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    storage.setItem(key, value);
    otherStorage.removeItem(key);
  }

  private removeFromStorage(key: string) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
