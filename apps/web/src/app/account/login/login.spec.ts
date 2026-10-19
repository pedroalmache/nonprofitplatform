import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { accessTokenStorageKey, accountApiUrl, refreshTokenStorageKey } from '../account-api';
import { authInterceptor } from '../auth.interceptor';
import { personApiUrl } from '../person-api';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([{ path: '', component: Login }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('shows the sign-in form when no access token is stored', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent).toContain('Sign in');
    expect(compiled.querySelector('label[for="email"]')?.textContent).toContain('Email');
    expect(compiled.querySelector('label[for="password"]')?.textContent).toContain('Password');
    expect(compiled.querySelector('main#main-content')).toBeTruthy();
    http.expectNone(accountApiUrl('/me'));
  });

  it('shows the API error and clears the password when sign-in is rejected', () => {
    fillForm(fixture, 'admin@example.org', 'wrong-password');
    submitForm(fixture);

    const login = http.expectOne(accountApiUrl('/login'));
    expect(login.request.url).toBe('http://localhost:5080/api/account/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.headers.has('Authorization')).toBe(false);
    expect(login.request.body).toEqual({
      email: 'admin@example.org',
      password: 'wrong-password',
      rememberMe: false,
    });
    login.flush(
      { message: 'The email or password is incorrect.' },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
      'The email or password is incorrect.',
    );
    expect((compiled.querySelector('#password') as HTMLInputElement).value).toBe('');
    expect(localStorage.getItem(accessTokenStorageKey)).toBeNull();
  });

  it('stores the access token and returns to the home page', async () => {
    fillForm(fixture, 'admin@example.org', 'correct-password');
    submitForm(fixture);

    const login = http.expectOne(accountApiUrl('/login'));
    login.flush({
      token: 'test-token',
      refreshToken: 'refresh-token',
      email: 'admin@example.org',
      username: 'admin@example.org',
      roles: ['admin'],
    });
    http
      .expectOne(personApiUrl('/me'))
      .flush('Not found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(localStorage.getItem(accessTokenStorageKey)).toBe('test-token');
    expect(localStorage.getItem(refreshTokenStorageKey)).toBe('refresh-token');
    expect(TestBed.inject(Router).url).toBe('/');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('You are signed in');
    const desktop = compiled.querySelector('.desktop-nav');
    const links = [...(desktop?.querySelectorAll('a') ?? [])];
    const manageIndex = links.findIndex((link) => link.textContent?.trim() === 'Manage');
    const accountIndex = links.findIndex(
      (link) => link.textContent?.trim() === 'admin@example.org',
    );
    expect(manageIndex).toBeGreaterThan(-1);
    expect(links[manageIndex]?.getAttribute('href')).toBe('/manage');
    expect(accountIndex).toBe(manageIndex + 1);
    expect(links[accountIndex]?.getAttribute('href')).toBe('/profile');
    http.expectNone(accountApiUrl('/logout'));
  });
});

describe('Login with a stored access token', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns home when a session is already stored', async () => {
    TestBed.resetTestingModule();
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([{ path: '', component: Login }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Login);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const me = http.expectOne(accountApiUrl('/me'));
    expect(me.request.headers.get('Authorization')).toBe('Bearer saved-token');
    me.flush({ email: 'admin@example.org', username: 'admin@example.org', roles: ['admin'] });
    http.expectOne(personApiUrl('/me')).flush({
      id: 'person-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      email: null,
      linkedIn: null,
      title: null,
      engineeringType: null,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/');
    expect(fixture.nativeElement.textContent).not.toContain('You are signed in');
    const desktop = fixture.nativeElement.querySelector('.desktop-nav') as HTMLElement;
    const links = [...desktop.querySelectorAll('a')];
    const manageIndex = links.findIndex((link) => link.textContent?.trim() === 'Manage');
    const accountIndex = links.findIndex(
      (link) => link.getAttribute('aria-label') === 'Your profile',
    );
    expect(manageIndex).toBeGreaterThan(-1);
    expect(accountIndex).toBe(manageIndex + 1);
    expect(links[accountIndex]?.getAttribute('href')).toBe('/profile');
    expect(links[accountIndex]?.querySelector('.avatar-placeholder')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Ada');
    http.verify();
  });

  it('hides Manage for a member', async () => {
    TestBed.resetTestingModule();
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([{ path: '', component: Login }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Login);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne(accountApiUrl('/me')).flush({
      email: 'member@example.org',
      username: 'member@example.org',
      roles: ['member'],
    });
    http.expectOne(personApiUrl('/me')).flush({
      id: 'person-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      email: null,
      linkedIn: null,
      title: null,
      engineeringType: null,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const desktop = fixture.nativeElement.querySelector('.desktop-nav') as HTMLElement;
    const manage = [...desktop.querySelectorAll('a')].find(
      (link) => link.textContent?.trim() === 'Manage',
    );
    expect(manage).toBeUndefined();
    const account = [...desktop.querySelectorAll('a')].find(
      (link) => link.getAttribute('aria-label') === 'Your profile',
    );
    expect(account?.getAttribute('href')).toBe('/profile');
    http.verify();
  });
});

function fillForm(fixture: ComponentFixture<Login>, email: string, password: string): void {
  const compiled = fixture.nativeElement as HTMLElement;
  const emailInput = compiled.querySelector('#email') as HTMLInputElement;
  const passwordInput = compiled.querySelector('#password') as HTMLInputElement;
  emailInput.value = email;
  emailInput.dispatchEvent(new Event('input'));
  passwordInput.value = password;
  passwordInput.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function submitForm(fixture: ComponentFixture<Login>): void {
  const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
  form.dispatchEvent(new Event('submit'));
}
