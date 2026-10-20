import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AccountApi } from '../account-api';
import { CurrentAccount } from '../current-account';
import { SiteFooter } from '../../site-footer/site-footer';
import { SiteHeader } from '../../site-header/site-header';

@Component({
  selector: 'app-login',
  imports: [SiteHeader, SiteFooter],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly account = inject(AccountApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly viewer = inject(CurrentAccount);

  protected readonly submitting = signal(false);
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly rememberMe = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.viewer.ready() && this.viewer.signedIn()) {
        void this.router.navigateByUrl('/');
      }
    });
  }

  protected onEmail(event: Event): void {
    this.email.set(inputValue(event));
  }

  protected onPassword(event: Event): void {
    this.password.set(inputValue(event));
  }

  protected onRemember(event: Event): void {
    const target = event.target;
    this.rememberMe.set(target instanceof HTMLInputElement && target.checked);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    this.account
      .login({
        email: this.email().trim(),
        password: this.password(),
        rememberMe: this.rememberMe(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.password.set('');
          this.submitting.set(false);
          this.viewer.noteSignIn(response.username || response.email, response.roles ?? []);
        },
        error: (error: unknown) => {
          this.password.set('');
          this.submitting.set(false);
          this.errorMessage.set(readMessage(error));
        },
      });
  }
}

function inputValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.value : '';
}

function readMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    if (typeof body === 'string' && body.trim().length > 0) {
      return body;
    }

    if (
      isRecord(body) &&
      typeof body['message'] === 'string' &&
      body['message'].trim().length > 0
    ) {
      return body['message'];
    }
  }

  return 'Sign-in could not be completed. Try again.';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
