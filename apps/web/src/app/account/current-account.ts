import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AccountApi, hasManageAccess } from './account-api';

@Injectable({ providedIn: 'root' })
export class CurrentAccount {
  private readonly account = inject(AccountApi);

  readonly ready = signal(false);
  readonly pending = signal(false);
  readonly username = signal<string | null>(null);
  readonly roles = signal<string[]>([]);
  readonly signedIn = computed(() => this.username() !== null);
  readonly canManage = computed(() => hasManageAccess(this.roles()));
  readonly menuLabel = computed(() => this.username() || 'Sign in');

  constructor() {
    this.refresh();
  }

  refresh(): void {
    if (!this.account.token()) {
      this.noteSignOut();
      return;
    }

    this.pending.set(true);
    this.ready.set(false);
    this.account.me().subscribe({
      next: (session) => {
        this.username.set(session.username || session.email);
        this.roles.set(session.roles ?? []);
        this.pending.set(false);
        this.ready.set(true);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.account.clearToken();
        }
        this.noteSignOut();
      },
    });
  }

  noteSignIn(username: string, roles: readonly string[] = []): void {
    this.username.set(username);
    this.roles.set([...roles]);
    this.pending.set(false);
    this.ready.set(true);
  }

  signOut(): void {
    this.account.clearToken();
    this.noteSignOut();
  }

  noteSignOut(): void {
    this.username.set(null);
    this.roles.set([]);
    this.pending.set(false);
    this.ready.set(true);
  }
}
