import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { accessTokenStorageKey, accountApiUrl } from '../account-api';
import { authInterceptor } from '../auth.interceptor';
import { eventApiUrl } from '../event-api';
import { memberApiUrl } from '../member-api';
import { personApiUrl } from '../person-api';
import { Manage } from './manage';

describe('Manage', () => {
  let fixture: ComponentFixture<Manage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    await TestBed.configureTestingModule({
      imports: [Manage],
      providers: [
        provideRouter([
          { path: '', component: Manage },
          { path: 'manage', component: Manage },
          { path: 'manage/:userId', component: Manage },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Manage);
    http = TestBed.inject(HttpTestingController);
    http.expectOne(accountApiUrl('/me')).flush({
      email: 'officer@example.org',
      username: 'officer@example.org',
      roles: ['officer'],
    });
    http.match(personApiUrl('/me')).forEach((request) => {
      request.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
    http.expectOne(memberApiUrl()).flush([
      {
        userId: 'user-amy',
        username: 'amy@example.org',
        firstName: 'Amy',
        lastName: 'Adams',
        role: 'member',
      },
      {
        userId: 'user-zoe',
        username: 'zoe@example.org',
        firstName: 'Zoe',
        lastName: 'Young',
        role: 'officer',
      },
    ]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('lists members and keeps Manage beside the account control', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent).toContain('Manage');
    const names = [...compiled.querySelectorAll('tbody th a')].map((link) =>
      link.textContent?.trim(),
    );
    expect(names).toEqual(['Adams, Amy', 'Young, Zoe']);
    expect(compiled.querySelector('a[href="/manage/user-amy"]')).toBeTruthy();
    expect(compiled.querySelector('select')).toBeNull();
    expect(compiled.textContent).toContain('Member');
    expect(compiled.textContent).toContain('Officer');

    const desktop = compiled.querySelector('.desktop-nav');
    const links = [...(desktop?.querySelectorAll('a') ?? [])];
    const manageIndex = links.findIndex((link) => link.textContent?.trim() === 'Manage');
    const directoryIndex = links.findIndex((link) => link.textContent?.trim() === 'Directory');
    const accountIndex = links.findIndex(
      (link) => link.textContent?.trim() === 'officer@example.org',
    );
    expect(manageIndex).toBe(directoryIndex + 1);
    expect(accountIndex).toBe(manageIndex + 1);
    expect(compiled.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain(
      'Members',
    );
  });

  it('opens the events tab', () => {
    const eventsTab = [...fixture.nativeElement.querySelectorAll('[role="tab"]')].find(
      (tab) => tab.textContent?.trim() === 'Events',
    ) as HTMLButtonElement;
    eventsTab.click();
    fixture.detectChanges();

    const request = http.expectOne(eventApiUrl());
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer saved-token');
    request.flush([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain(
      'Events',
    );
    expect(compiled.textContent).toContain('+ Add Event');
    expect(compiled.textContent).not.toContain('No upcoming events are on the website.');
    expect(compiled.querySelector('tbody')).toBeNull();
  });

  it('creates a member from the overlay and opens that profile', async () => {
    const create = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Create',
    ) as HTMLButtonElement;
    create.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('label[for="create-username"]')?.textContent,
    ).toContain('Username');
    expect(
      fixture.nativeElement.querySelector('label[for="create-first-name"]')?.textContent,
    ).toContain('First name');
    expect(
      fixture.nativeElement.querySelector('label[for="create-last-name"]')?.textContent,
    ).toContain('Last name');

    fill(fixture, '#create-username', 'not-an-email');
    fill(fixture, '#create-first-name', 'Nora');
    fill(fixture, '#create-last-name', 'Ng');
    const form = fixture.nativeElement.querySelector('.dialog-panel form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Enter an email address. Members sign in with that address.',
    );
    http.expectNone(memberApiUrl());

    fill(fixture, '#create-username', 'nora@example.org');
    form.dispatchEvent(new Event('submit'));
    const request = http.expectOne(memberApiUrl());
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer saved-token');
    expect(request.request.body).toEqual({
      username: 'nora@example.org',
      firstName: 'Nora',
      lastName: 'Ng',
    });
    request.flush({
      userId: 'user-9',
      username: 'nora@example.org',
      firstName: 'Nora',
      lastName: 'Ng',
      claimToken: 'claim-token-1',
    });
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/manage/user-9');
  });
});

describe('Manage role changes', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('lets an admin change another member and keeps their own role fixed', async () => {
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    await TestBed.configureTestingModule({
      imports: [Manage],
      providers: [
        provideRouter([
          { path: '', component: Manage },
          { path: 'manage', component: Manage },
          { path: 'manage/:userId', component: Manage },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Manage);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(accountApiUrl('/me')).flush({
      userId: 'user-admin',
      email: 'admin@example.org',
      username: 'admin@example.org',
      roles: ['admin'],
    });
    http.match(personApiUrl('/me')).forEach((request) => {
      request.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
    http.expectOne(memberApiUrl()).flush([
      {
        userId: 'user-amy',
        username: 'amy@example.org',
        firstName: 'Amy',
        lastName: 'Adams',
        role: 'member',
      },
      {
        userId: 'user-admin',
        username: 'admin@example.org',
        firstName: 'Ada',
        lastName: 'Admin',
        role: 'admin',
      },
    ]);
    fixture.detectChanges();

    const selects = [...fixture.nativeElement.querySelectorAll('select')] as HTMLSelectElement[];
    expect(selects.map((select) => select.value)).toEqual(['member', 'admin']);
    expect(selects[0].disabled).toBe(false);
    expect(selects[1].disabled).toBe(true);
    expect(selects[0].getAttribute('aria-label')).toBe('Role for Adams, Amy');

    selects[0].value = 'officer';
    selects[0].dispatchEvent(new Event('change'));
    const request = http.expectOne(memberApiUrl('/user-amy/role'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.headers.get('Authorization')).toBe('Bearer saved-token');
    expect(request.request.body).toEqual({ role: 'officer' });
    request.flush({ userId: 'user-amy', role: 'officer' });
    fixture.detectChanges();

    expect(selects[0].value).toBe('officer');
    http.verify();
  });
});

function fill(fixture: ComponentFixture<Manage>, selector: string, value: string): void {
  const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}
