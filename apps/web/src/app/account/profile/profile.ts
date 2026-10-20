import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SiteFooter } from '../../site-footer/site-footer';
import { SiteHeader } from '../../site-header/site-header';
import { CurrentAccount } from '../current-account';
import { PersonApi } from '../person-api';

@Component({
  selector: 'app-profile',
  imports: [SiteHeader, SiteFooter],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly people = inject(PersonApi);
  private readonly viewer = inject(CurrentAccount);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly notice = signal<string | null>(null);
  protected readonly firstName = signal('');
  protected readonly lastName = signal('');

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.noticeTimer !== null) {
        clearTimeout(this.noticeTimer);
      }
    });
    this.people
      .mine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (person) => {
          this.firstName.set(person.firstName);
          this.lastName.set(person.lastName);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return;
          }
          this.firstName.set('');
          this.lastName.set('');
          this.loading.set(false);
        },
      });
  }

  protected onFirstName(event: Event): void {
    this.firstName.set(inputValue(event));
  }

  protected onLastName(event: Event): void {
    this.lastName.set(inputValue(event));
  }

  protected save(event: Event): void {
    event.preventDefault();
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errors.set([]);
    this.people
      .save({
        firstName: this.firstName().trim(),
        lastName: this.lastName().trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (person) => {
          this.firstName.set(person.firstName);
          this.lastName.set(person.lastName);
          this.saving.set(false);
          this.showNotice('Your profile is saved.');
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.errors.set(readErrors(error));
        },
      });
  }

  protected signOut(): void {
    this.viewer.signOut();
    void this.router.navigateByUrl('/');
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    if (this.noticeTimer !== null) {
      clearTimeout(this.noticeTimer);
    }
    this.noticeTimer = setTimeout(() => {
      this.notice.set(null);
      this.noticeTimer = null;
    }, 4000);
  }
}

function inputValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.value : '';
}

function readErrors(error: unknown): string[] {
  if (error instanceof HttpErrorResponse && isRecord(error.error)) {
    const errors = error.error['errors'];
    if (Array.isArray(errors)) {
      const messages = errors.filter((item): item is string => typeof item === 'string');
      if (messages.length > 0) {
        return messages;
      }
    }
  }

  return ['Your profile could not be saved. Try again.'];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
