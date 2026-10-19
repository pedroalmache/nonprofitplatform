import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { accountApiUrl } from '../account-api';
import { authInterceptor } from '../auth.interceptor';
import { claimAccountUrl } from '../claim-link';
import { ClaimAccount } from './claim-account';

describe('claimAccountUrl', () => {
  it('encodes the user and token in a claim-account link', () => {
    expect(claimAccountUrl('user 2', 'reset+token/=', 'http://localhost:4200')).toBe(
      'http://localhost:4200/claim-account?userId=user+2&token=reset%2Btoken%2F%3D',
    );
  });
});

describe('ClaimAccount', () => {
  let fixture: ComponentFixture<ClaimAccount>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ClaimAccount],
      providers: [
        provideRouter([
          { path: 'claim-account', component: ClaimAccount },
          { path: 'login', component: ClaimAccount },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('shows an invalid link when the token is missing', async () => {
    await open('/claim-account');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent).toContain('Claim your account');
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
      'This claim link is invalid or has expired.',
    );
    expect(compiled.querySelector('form')).toBeNull();
    http.expectNone(accountApiUrl('/claim'));
  });

  it('asks for a password before calling the server', async () => {
    await open('/claim-account?userId=user-9&token=reset%2Btoken');
    submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Enter a password.',
    );
    http.expectNone(accountApiUrl('/claim'));
  });

  it('rejects a confirmation that does not match', async () => {
    await open('/claim-account?userId=user-9&token=reset%2Btoken');
    fill('#password', 'Secret123!');
    fill('#confirm-password', 'Secret123');
    submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'The passwords do not match.',
    );
    http.expectNone(accountApiUrl('/claim'));
  });

  it('claims the account and points to sign in', async () => {
    await open('/claim-account?userId=user-9&token=reset%2Btoken');
    fill('#password', 'Secret123!');
    fill('#confirm-password', 'Secret123!');
    submit();

    const request = http.expectOne(accountApiUrl('/claim'));
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.body).toEqual({
      userId: 'user-9',
      token: 'reset+token',
      password: 'Secret123!',
      confirmPassword: 'Secret123!',
    });
    request.flush({ claimed: true });
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(
      'This account is claimed. Sign in with the password you just chose.',
    );
    expect(compiled.querySelector('a[href="/login"]')?.textContent).toContain('Sign in');
    expect(compiled.querySelector('form')).toBeNull();
    expect(localStorage.getItem('ewbsbv.accessToken')).toBeNull();
  });

  it('shows an already claimed account without the password form', async () => {
    await open('/claim-account?userId=user-9&token=reset%2Btoken');
    fill('#password', 'Secret123!');
    fill('#confirm-password', 'Secret123!');
    submit();
    http
      .expectOne(accountApiUrl('/claim'))
      .flush(
        { message: 'This account has already been claimed.' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('This account has already been claimed.');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  async function open(url: string): Promise<void> {
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    fixture = TestBed.createComponent(ClaimAccount);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  function fill(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
  }
});
