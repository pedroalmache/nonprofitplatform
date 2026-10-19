import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AccountApi, hasManageAccess } from './account-api';
import { PersonApi, PersonProfile } from './person-api';

@Injectable({ providedIn: 'root' })
export class CurrentAccount {
  private readonly account = inject(AccountApi);
  private readonly people = inject(PersonApi);
  private personRequest = 0;

  readonly ready = signal(false);
  readonly pending = signal(false);
  readonly username = signal<string | null>(null);
  readonly userId = signal<string | null>(null);
  readonly roles = signal<string[]>([]);
  readonly hasPerson = signal(false);
  readonly profilePictureUrl = signal<string | null>(null);
  readonly signedIn = computed(() => this.username() !== null);
  readonly canManage = computed(() => hasManageAccess(this.roles()));
  readonly isAdmin = computed(() => this.roles().includes('admin'));
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
        this.userId.set(session.userId ?? null);
        this.roles.set(session.roles ?? []);
        this.pending.set(false);
        this.ready.set(true);
        this.loadPerson();
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.account.clearToken();
        }
        this.noteSignOut();
      },
    });
  }

  noteSignIn(username: string, roles: readonly string[] = [], userId: string | null = null): void {
    this.username.set(username);
    this.userId.set(userId);
    this.roles.set([...roles]);
    this.hasPerson.set(false);
    this.profilePictureUrl.set(null);
    this.pending.set(false);
    this.ready.set(true);
    this.loadPerson();
  }

  notePerson(person: Pick<PersonProfile, 'profilePictureUrl'>): void {
    this.hasPerson.set(true);
    const picture = person.profilePictureUrl?.trim() ?? '';
    this.profilePictureUrl.set(picture.length > 0 ? picture : null);
  }

  signOut(): void {
    this.account.clearToken();
    this.noteSignOut();
  }

  noteSignOut(): void {
    this.personRequest += 1;
    this.username.set(null);
    this.userId.set(null);
    this.roles.set([]);
    this.hasPerson.set(false);
    this.profilePictureUrl.set(null);
    this.pending.set(false);
    this.ready.set(true);
  }

  private loadPerson(): void {
    const request = ++this.personRequest;
    this.people.mine().subscribe({
      next: (person) => {
        if (request !== this.personRequest) {
          return;
        }
        this.notePerson(person);
      },
      error: () => {
        if (request !== this.personRequest) {
          return;
        }
        this.hasPerson.set(false);
        this.profilePictureUrl.set(null);
      },
    });
  }
}
