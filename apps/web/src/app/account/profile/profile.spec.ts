import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { accessTokenStorageKey, accountApiUrl } from '../account-api';
import { authInterceptor } from '../auth.interceptor';
import { personApiUrl } from '../person-api';
import { Profile } from './profile';

describe('Profile', () => {
  let fixture: ComponentFixture<Profile>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideRouter([{ path: '', component: Profile }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    http = TestBed.inject(HttpTestingController);
    http.expectOne(accountApiUrl('/me')).flush({
      email: 'admin@example.org',
      username: 'admin@example.org',
      roles: ['admin'],
    });
    http.expectOne(personApiUrl('/me')).flush('Not found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('shows an empty profile form when the account has no person', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent).toContain('Your profile');
    expect(compiled.querySelector('label[for="first-name"]')?.textContent).toContain('First name');
    expect(compiled.querySelector('label[for="last-name"]')?.textContent).toContain('Last name');
    expect((compiled.querySelector('#first-name') as HTMLInputElement).value).toBe('');
    expect(compiled.textContent).toContain('Save the name for your account.');
  });

  it('creates the person and keeps the saved name', () => {
    fill(fixture, '#first-name', 'Ada');
    fill(fixture, '#last-name', 'Lovelace');
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    const save = http.expectOne(personApiUrl('/me'));
    expect(save.request.method).toBe('PUT');
    expect(save.request.headers.get('Authorization')).toBe('Bearer saved-token');
    expect(save.request.body).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    save.flush({
      id: 'person-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const notice = compiled.querySelector('.snackbar');
    expect(notice?.getAttribute('role')).toBe('status');
    expect(notice?.textContent).toContain('Your profile is saved.');
    expect((compiled.querySelector('#first-name') as HTMLInputElement).value).toBe('Ada');
    expect((compiled.querySelector('#last-name') as HTMLInputElement).value).toBe('Lovelace');
  });

  it('hides the snackbar after a few seconds', () => {
    vi.useFakeTimers();
    try {
      fill(fixture, '#first-name', 'Ada');
      fill(fixture, '#last-name', 'Lovelace');
      const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));
      http.expectOne(personApiUrl('/me')).flush({
        id: 'person-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
      });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.snackbar')).toBeTruthy();

      vi.advanceTimersByTime(4000);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.snackbar')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('signs out from the profile page', async () => {
    const signOut = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Sign out',
    ) as HTMLButtonElement;
    signOut.click();
    await fixture.whenStable();

    expect(localStorage.getItem(accessTokenStorageKey)).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/');
  });
});

function fill(fixture: ComponentFixture<Profile>, selector: string, value: string): void {
  const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}
