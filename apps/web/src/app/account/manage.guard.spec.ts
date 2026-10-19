import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { accessTokenStorageKey, accountApiUrl } from './account-api';
import { authInterceptor } from './auth.interceptor';
import { manageGuard } from './manage.guard';

describe('manageGuard', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', children: [] },
          { path: 'login', children: [] },
          { path: 'manage', children: [] },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('sends anonymous visitors to sign in', async () => {
    const outcome = await activate();
    expect(urlOf(outcome)).toBe('/login');
    http.expectNone(accountApiUrl('/me'));
  });

  it('sends a member home', async () => {
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    const pending = activate();
    http.expectOne(accountApiUrl('/me')).flush({
      email: 'member@example.org',
      username: 'member@example.org',
      roles: ['member'],
    });
    expect(urlOf(await pending)).toBe('/');
  });

  it('allows an officer or an admin', async () => {
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    const officer = activate();
    http.expectOne(accountApiUrl('/me')).flush({
      email: 'officer@example.org',
      username: 'officer@example.org',
      roles: ['officer'],
    });
    expect(await officer).toBe(true);

    const admin = activate();
    http.expectOne(accountApiUrl('/me')).flush({
      email: 'admin@example.org',
      username: 'admin@example.org',
      roles: ['admin'],
    });
    expect(await admin).toBe(true);
  });

  it('sends an expired session home', async () => {
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    const pending = activate();
    http
      .expectOne(accountApiUrl('/me'))
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(urlOf(await pending)).toBe('/');
    expect(localStorage.getItem(accessTokenStorageKey)).toBeNull();
  });
});

function activate(): Promise<boolean | UrlTree> {
  const result = TestBed.runInInjectionContext(() =>
    manageGuard(undefined as never, undefined as never),
  );
  if (isObservable(result)) {
    return firstValueFrom(result as Observable<boolean | UrlTree>);
  }
  return Promise.resolve(result as boolean | UrlTree);
}

function urlOf(outcome: boolean | UrlTree): string {
  return outcome instanceof UrlTree ? TestBed.inject(Router).serializeUrl(outcome) : '';
}
