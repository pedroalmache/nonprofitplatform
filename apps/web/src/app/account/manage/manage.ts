import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { SiteFooter } from '../../site-footer/site-footer';
import { SiteHeader } from '../../site-header/site-header';
import { CurrentAccount } from '../current-account';
import { focusFirstField, trapDialogKeydown } from '../dialog';
import { MemberApi, MemberRole, RosterMember, rosterName } from '../member-api';
import { ManageEvents } from './manage-events';

@Component({
  selector: 'app-manage',
  imports: [SiteHeader, SiteFooter, RouterLink, ManageEvents],
  templateUrl: './manage.html',
  styleUrl: './manage.scss',
})
export class Manage {
  private readonly members = inject(MemberApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly viewer = inject(CurrentAccount);

  protected readonly loading = signal(true);
  protected readonly creating = signal(false);
  protected readonly roster = signal<RosterMember[]>([]);
  protected readonly loadError = signal<string | null>(null);
  protected readonly createOpen = signal(false);
  protected readonly username = signal('');
  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly usernameError = signal<string | null>(null);
  protected readonly firstNameError = signal<string | null>(null);
  protected readonly lastNameError = signal<string | null>(null);
  protected readonly createErrors = signal<string[]>([]);
  protected readonly rosterName = rosterName;
  protected readonly tab = signal<'members' | 'events'>('members');
  protected readonly eventsDialog = signal(false);
  protected readonly savingRole = signal<string | null>(null);
  protected readonly roleError = signal<string | null>(null);
  protected readonly roleLabel = roleLabel;
  private readonly createButton = viewChild<ElementRef<HTMLButtonElement>>('createButton');
  private readonly createDialog = viewChild<ElementRef<HTMLElement>>('createDialog');

  constructor() {
    this.members
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (roster) => {
          this.roster.set(roster);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return;
          }
          if (error instanceof HttpErrorResponse && error.status === 403) {
            void this.router.navigateByUrl('/');
            return;
          }
          this.loadError.set('The roster could not be loaded.');
          this.loading.set(false);
        },
      });
  }

  protected showMembers(): void {
    this.tab.set('members');
  }

  protected showEvents(): void {
    this.tab.set('events');
  }

  protected onEventsDialog(open: boolean): void {
    this.eventsDialog.set(open);
  }

  protected onTabKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }

    event.preventDefault();
    if (this.tab() === 'members') {
      this.showEvents();
    } else {
      this.showMembers();
    }
    queueMicrotask(() => {
      const id = this.tab() === 'members' ? 'manage-tab-members' : 'manage-tab-events';
      document.getElementById(id)?.focus();
    });
  }

  protected openMember(userId: string): void {
    void this.router.navigate(['/manage', userId]);
  }

  protected changeRole(member: RosterMember, event: Event): void {
    event.stopPropagation();
    const select = event.target;
    if (
      !(select instanceof HTMLSelectElement) ||
      !isMemberRole(select.value) ||
      select.value === member.role
    ) {
      return;
    }

    const role = select.value;
    this.roleError.set(null);
    this.savingRole.set(member.userId);
    this.members
      .changeRole(member.userId, role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.roster.update((rows) =>
            rows.map((row) =>
              row.userId === member.userId ? { ...row, role: updated.role } : row,
            ),
          );
          this.savingRole.set(null);
        },
        error: (error: unknown) => {
          select.value = member.role;
          this.savingRole.set(null);
          this.roleError.set(roleChangeMessage(error));
        },
      });
  }

  protected openCreate(): void {
    this.username.set('');
    this.firstName.set('');
    this.lastName.set('');
    this.usernameError.set(null);
    this.firstNameError.set(null);
    this.lastNameError.set(null);
    this.createErrors.set([]);
    this.createOpen.set(true);
    setTimeout(() => focusFirstField(this.createDialog()?.nativeElement));
  }

  protected closeCreate(): void {
    if (this.creating()) {
      return;
    }
    this.createOpen.set(false);
    queueMicrotask(() => this.createButton()?.nativeElement.focus());
  }

  protected onCreateKeydown(event: KeyboardEvent): void {
    trapDialogKeydown(event, () => this.closeCreate());
  }

  protected onUsername(event: Event): void {
    const value = inputValue(event);
    this.username.set(value);
    if (this.usernameError()) {
      this.usernameError.set(usernameError(value));
    }
  }

  protected onFirstName(event: Event): void {
    const value = inputValue(event);
    this.firstName.set(value);
    if (this.firstNameError()) {
      this.firstNameError.set(requiredName(value, 'first name'));
    }
  }

  protected onLastName(event: Event): void {
    const value = inputValue(event);
    this.lastName.set(value);
    if (this.lastNameError()) {
      this.lastNameError.set(requiredName(value, 'last name'));
    }
  }

  protected create(event: Event): void {
    event.preventDefault();
    if (this.creating()) {
      return;
    }

    const nextUsernameError = usernameError(this.username());
    const nextFirstError = requiredName(this.firstName(), 'first name');
    const nextLastError = requiredName(this.lastName(), 'last name');
    this.usernameError.set(nextUsernameError);
    this.firstNameError.set(nextFirstError);
    this.lastNameError.set(nextLastError);
    this.createErrors.set([]);
    if (nextUsernameError || nextFirstError || nextLastError) {
      return;
    }

    this.creating.set(true);
    this.members
      .create({
        username: this.username().trim(),
        firstName: this.firstName().trim(),
        lastName: this.lastName().trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (member) => {
          this.creating.set(false);
          this.createOpen.set(false);
          void this.router.navigate(['/manage', member.userId], {
            state: { claimToken: member.claimToken },
          });
        },
        error: (error: unknown) => {
          this.creating.set(false);
          this.createErrors.set(readErrors(error));
        },
      });
  }
}

function inputValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.value : '';
}

function requiredName(value: string, label: string): string | null {
  return value.trim() ? null : `Enter a ${label}.`;
}

function usernameError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Enter a username.';
  }

  const atIndex = trimmed.indexOf('@');
  if (
    trimmed.length > 256 ||
    atIndex <= 0 ||
    atIndex !== trimmed.lastIndexOf('@') ||
    atIndex === trimmed.length - 1 ||
    trimmed.includes(' ')
  ) {
    return 'Enter an email address. Members sign in with that address.';
  }

  return null;
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

  return ['The account could not be created. Try again.'];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMemberRole(value: string): value is MemberRole {
  return value === 'admin' || value === 'officer' || value === 'member';
}

function roleLabel(role: string): string {
  if (role === 'admin') {
    return 'Admin';
  }
  if (role === 'officer') {
    return 'Officer';
  }
  return 'Member';
}

function roleChangeMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 403) {
    return 'Only an admin can change roles.';
  }
  if (error instanceof HttpErrorResponse && isRecord(error.error)) {
    const errors = error.error['errors'];
    if (Array.isArray(errors)) {
      const message = errors.find((item): item is string => typeof item === 'string');
      if (message) {
        return message;
      }
    }
  }
  return 'The role could not be changed.';
}
