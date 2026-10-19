import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { apiUrl } from '../api-url';

export const accessTokenStorageKey = 'ewbsbv.accessToken';
export const refreshTokenStorageKey = 'ewbsbv.refreshToken';

export function accountApiUrl(path: '/login' | '/me' | '/logout' | '/refresh' | '/claim'): string {
  return `${apiUrl.replace(/\/$/, '')}/api/account${path}`;
}

export interface AccountSession {
  userId?: string;
  email: string;
  username?: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ClaimAccountInput {
  userId: string;
  token: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse extends AccountSession {
  token: string;
  refreshToken?: string;
}

export function hasManageAccess(roles: readonly string[]): boolean {
  return roles.some((role) => role === 'admin' || role === 'officer');
}

@Injectable({ providedIn: 'root' })
export class AccountApi {
  private readonly http = inject(HttpClient);

  token(): string | null {
    return localStorage.getItem(accessTokenStorageKey);
  }

  refreshToken(): string | null {
    return localStorage.getItem(refreshTokenStorageKey);
  }

  storeSession(response: LoginResponse): void {
    localStorage.setItem(accessTokenStorageKey, response.token);
    if (response.refreshToken) {
      localStorage.setItem(refreshTokenStorageKey, response.refreshToken);
      return;
    }

    localStorage.removeItem(refreshTokenStorageKey);
  }

  me(): Observable<AccountSession> {
    return this.http.get<AccountSession>(accountApiUrl('/me'));
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(accountApiUrl('/login'), request)
      .pipe(tap((response) => this.storeSession(response)));
  }

  claim(input: ClaimAccountInput): Observable<{ claimed: boolean }> {
    return this.http.post<{ claimed: boolean }>(accountApiUrl('/claim'), input);
  }

  clearToken(): void {
    localStorage.removeItem(accessTokenStorageKey);
    localStorage.removeItem(refreshTokenStorageKey);
  }
}
