import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccountApi } from '../account-api';
import { SiteFooter } from '../../site-footer/site-footer';
import { SiteHeader } from '../../site-header/site-header';

@Component({
  selector: 'app-claim-account',
  imports: [SiteHeader, SiteFooter, RouterLink],
  templateUrl: './claim-account.html',
  styleUrl: './claim-account.scss',
})
export class ClaimAccount {
  private readonly account = inject(AccountApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly userId = signal('');
  protected readonly token = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly claimed = signal(false);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.userId.set(params.get('userId')?.trim() ?? '');
      this.token.set(params.get('token')?.trim() ?? '');
    });
  }

  protected linkReady(): boolean {
    return this.userId().length > 0 && this.token().length > 0;
  }

  protected onPassword(event: Event): void {
    this.password.set(inputValue(event));
  }

  protected onConfirmPassword(event: Event): void {
    this.confirmPassword.set(inputValue(event));
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.submitting() || this.claimed() || !this.linkReady()) {
      return;
    }

    const password = this.password();
    if (!password.trim()) {
      this.errorMessage.set('Enter a password.');
      return;
    }

    if (password !== this.confirmPassword()) {
      this.errorMessage.set('The passwords do not match.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    this.account
      .claim({
        userId: this.userId(),
        token: this.token(),
        password,
        confirmPassword: this.confirmPassword(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.password.set('');
          this.confirmPassword.set('');
          this.submitting.set(false);
          this.claimed.set(true);
        },
        error: (error: unknown) => {
          this.password.set('');
          this.confirmPassword.set('');
          this.submitting.set(false);
          const result = readClaimError(error);
          this.errorMessage.set(result.message);
          if (result.alreadyClaimed) {
            this.claimed.set(true);
          }
        },
      });
  }
}

function inputValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.value : '';
}

function readClaimError(error: unknown): { message: string; alreadyClaimed: boolean } {
  if (error instanceof HttpErrorResponse && isRecord(error.error)) {
    const errors = error.error['errors'];
    if (Array.isArray(errors)) {
      const messages = errors.filter((item): item is string => typeof item === 'string');
      if (messages.length > 0) {
        return { message: messages.join(' '), alreadyClaimed: false };
      }
    }

    const message = error.error['message'];
    if (typeof message === 'string' && message.trim().length > 0) {
      return { message, alreadyClaimed: error.status === 409 };
    }
  }

  return { message: 'This account could not be claimed. Try again.', alreadyClaimed: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
