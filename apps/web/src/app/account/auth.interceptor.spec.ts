import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { accessTokenStorageKey, accountApiUrl, refreshTokenStorageKey } from './account-api';
import { authInterceptor } from './auth.interceptor';
import { CurrentAccount } from './current-account';

describe('authInterceptor', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', children: [] },
          { path: 'profile', children: [] },
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

  it('refreshes an expired access token and retries the request', async () => {
    localStorage.setItem(accessTokenStorageKey, 'expired-access');
    localStorage.setItem(refreshTokenStorageKey, 'refresh-1');
    const pending = firstValueFrom(
      TestBed.inject(HttpClient).get<{ email: string }>(accountApiUrl('/me')),
    );

    const expired = http.expectOne(accountApiUrl('/me'));
    expect(expired.request.headers.get('Authorization')).toBe('Bearer expired-access');
    expired.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const refresh = http.expectOne(accountApiUrl('/refresh'));
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
    refresh.flush({ token: 'new-access', refreshToken: 'refresh-2' });

    const retried = http.expectOne(accountApiUrl('/me'));
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-access');
    retried.flush({ email: 'admin@example.org', username: 'admin@example.org', roles: ['admin'] });

    await expect(pending).resolves.toMatchObject({ email: 'admin@example.org' });
    expect(localStorage.getItem(accessTokenStorageKey)).toBe('new-access');
    expect(localStorage.getItem(refreshTokenStorageKey)).toBe('refresh-2');
  });

  it('signs out and returns home when the refresh token is rejected', async () => {
    localStorage.setItem(accessTokenStorageKey, 'expired-access');
    localStorage.setItem(refreshTokenStorageKey, 'refresh-1');
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/profile');
    const viewer = TestBed.inject(CurrentAccount);

    http
      .expectOne(accountApiUrl('/me'))
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne(accountApiUrl('/refresh'))
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(localStorage.getItem(accessTokenStorageKey)).toBeNull();
    expect(localStorage.getItem(refreshTokenStorageKey)).toBeNull();
    expect(viewer.signedIn()).toBe(false);
    expect(viewer.menuLabel()).toBe('Sign in');
    expect(router.url).toBe('/');
  });

  it('does not refresh when sign-in itself is rejected', async () => {
    localStorage.setItem(accessTokenStorageKey, 'expired-access');
    localStorage.setItem(refreshTokenStorageKey, 'refresh-1');
    const pending = firstValueFrom(
      TestBed.inject(HttpClient).post(accountApiUrl('/login'), {
        email: 'admin@example.org',
        password: 'wrong-password',
        rememberMe: false,
      }),
    );

    const login = http.expectOne(accountApiUrl('/login'));
    expect(login.request.headers.get('Authorization')).toBe('Bearer expired-access');
    login.flush(
      { message: 'The email or password is incorrect.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(pending).rejects.toBeTruthy();
    http.expectNone(accountApiUrl('/refresh'));
    expect(localStorage.getItem(refreshTokenStorageKey)).toBe('refresh-1');
  });
});
