import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { AccountApi, LoginResponse, accountApiUrl } from './account-api';
import { CurrentAccount } from './current-account';

@Injectable({ providedIn: 'root' })
export class SessionRefresh {
  private readonly backend = inject(HttpBackend);
  private readonly account = inject(AccountApi);
  private readonly injector = inject(Injector);
  private inFlight: Observable<boolean> | null = null;

  refresh(): Observable<boolean> {
    const refreshToken = this.account.refreshToken();
    if (!refreshToken) {
      this.signOut();
      return of(false);
    }

    this.inFlight ??= this.start(refreshToken);
    return this.inFlight;
  }

  signOut(): void {
    this.account.clearToken();
    this.injector.get(CurrentAccount).signOut();
    void this.injector.get(Router).navigateByUrl('/');
  }

  private start(refreshToken: string): Observable<boolean> {
    const http = new HttpClient(this.backend);
    return http.post<LoginResponse>(accountApiUrl('/refresh'), { refreshToken }).pipe(
      tap((response) => this.account.storeSession(response)),
      map(() => true),
      catchError(() => {
        this.signOut();
        return of(false);
      }),
      finalize(() => {
        this.inFlight = null;
      }),
      shareReplay(1),
    );
  }
}
