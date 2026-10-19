import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { accessTokenStorageKey, accountApiUrl } from '../account-api';
import { authInterceptor } from '../auth.interceptor';
import { claimAccountUrl } from '../claim-link';
import { memberApiUrl } from '../member-api';
import { personApiUrl } from '../person-api';
import { emailError, formatPhone, internationalPhone, phoneError } from './profile-contact';
import { Profile } from './profile';
import { vi } from 'vitest';

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
    http.match(personApiUrl('/me')).forEach((request) => {
      request.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
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
    expect(compiled.querySelector('label[for="engineering-type"]')?.textContent).toContain(
      'Engineering',
    );
    expect((compiled.querySelector('#first-name') as HTMLInputElement).value).toBe('');
    expect(compiled.textContent).toContain('Save your name before adding a picture.');
    expect(compiled.querySelector('#profile-picture')).toBeNull();
    expect(
      [...compiled.querySelectorAll('button')].some(
        (button) => button.textContent?.trim() === 'Delete',
      ),
    ).toBe(false);
  });

  it('creates the person and keeps the saved name', () => {
    fill(fixture, '#first-name', 'Ada');
    fill(fixture, '#last-name', 'Lovelace');
    fill(fixture, '#engineering-type', 'Civil');
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    const save = http.expectOne(personApiUrl('/me'));
    expect(save.request.method).toBe('PUT');
    expect(save.request.headers.get('Authorization')).toBe('Bearer saved-token');
    expect(save.request.body).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '',
      email: '',
      linkedIn: '',
      title: '',
      engineeringType: 'Civil',
    });
    save.flush({
      id: 'person-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      email: null,
      linkedIn: null,
      title: null,
      engineeringType: 'Civil',
    });
    flushShared(http);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const notice = compiled.querySelector('.snackbar');
    expect(notice?.getAttribute('role')).toBe('status');
    expect(notice?.textContent).toContain('Your profile is saved.');
    const menu = [...compiled.querySelectorAll('a')].find(
      (link) => link.getAttribute('aria-label') === 'Your profile',
    );
    expect(menu?.querySelector('.avatar-placeholder')).toBeTruthy();
  });

  it('uploads a profile picture for the signed-in account', () => {
    fill(fixture, '#first-name', 'Ada');
    fill(fixture, '#last-name', 'Lovelace');
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    http.expectOne(personApiUrl('/me')).flush({
      id: 'person-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      email: null,
      linkedIn: null,
      title: null,
      engineeringType: null,
      profilePictureUrl: null,
    });
    flushShared(http);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#profile-picture') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'face.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const upload = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Upload picture',
    ) as HTMLButtonElement;
    upload.click();

    const request = http.expectOne(personApiUrl('/me/picture'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.get('Authorization')).toBe('Bearer saved-token');
    expect(request.request.body instanceof FormData).toBe(true);
    request.flush({
      id: 'person-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      email: null,
      linkedIn: null,
      title: null,
      engineeringType: null,
      profilePictureUrl: 'https://pub.example/users/user-1/profile-abc.webp',
    });
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('.profile-picture img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://pub.example/users/user-1/profile-abc.webp');
    const avatar = fixture.nativeElement.querySelector('.account-avatar img') as HTMLImageElement;
    expect(avatar.getAttribute('src')).toBe('https://pub.example/users/user-1/profile-abc.webp');
    expect(avatar.getAttribute('alt')).toBe('');
    expect(image.getAttribute('alt')).toBe('Your profile picture');
    const notice = fixture.nativeElement.querySelector('.snackbar');
    expect(notice?.getAttribute('role')).toBe('status');
    expect(notice?.textContent).toContain('Your profile picture is saved.');
  });

  it('shares a picture and lists it on the profile', () => {
    fill(fixture, '#first-name', 'Ada');
    fill(fixture, '#last-name', 'Lovelace');
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    http.expectOne(personApiUrl('/me')).flush({
      id: 'person-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      email: null,
      linkedIn: null,
      title: null,
      engineeringType: null,
      profilePictureUrl: null,
    });
    flushShared(http);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('#shared-pictures-heading');
    expect(heading?.textContent).toContain('Shared pictures');
    expect(
      heading !== null &&
        (form.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING) ===
          Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(true);
    const input = compiled.querySelector('#shared-picture') as HTMLInputElement;
    expect(input.multiple).toBe(true);
    const file = new File([new Uint8Array([1, 2, 3])], 'field.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const share = [...compiled.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Share picture',
    ) as HTMLButtonElement;
    share.click();

    const request = http.expectOne(personApiUrl('/me/pictures'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBe(true);
    request.flush({ id: 'pic-1', url: 'https://files.example/shared.webp' });
    fixture.detectChanges();

    const image = compiled.querySelector('.shared-picture-list img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://files.example/shared.webp');
    expect(image.getAttribute('alt')).toBe('Shared picture 1');
  });

  it('shares several pictures from one selection', () => {
    fill(fixture, '#first-name', 'Ada');
    fill(fixture, '#last-name', 'Lovelace');
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    http.expectOne(personApiUrl('/me')).flush({
      id: 'person-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      email: null,
      linkedIn: null,
      title: null,
      engineeringType: null,
      profilePictureUrl: null,
    });
    flushShared(http);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#shared-picture') as HTMLInputElement;
    const files = [
      new File([new Uint8Array([1])], 'one.png', { type: 'image/png' }),
      new File([new Uint8Array([2])], 'two.png', { type: 'image/png' }),
    ];
    Object.defineProperty(input, 'files', { value: files });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(compiled.textContent).toContain('2 pictures selected.');
    const share = [...compiled.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Share pictures',
    ) as HTMLButtonElement;
    share.click();

    const first = http.expectOne(personApiUrl('/me/pictures'));
    expect(first.request.method).toBe('POST');
    first.flush({ id: 'pic-1', url: 'https://files.example/one.webp' });
    fixture.detectChanges();
    const second = http.expectOne(personApiUrl('/me/pictures'));
    second.flush({ id: 'pic-2', url: 'https://files.example/two.webp' });
    fixture.detectChanges();

    const images = compiled.querySelectorAll('.shared-picture-list img');
    expect(images.length).toBe(2);
    expect(compiled.querySelector('.snackbar')?.textContent).toContain('Your pictures are shared.');
  });

  it('formats the phone number as it is typed and rejects an incomplete number', () => {
    fill(fixture, '#phone', '8055551212');
    expect((fixture.nativeElement.querySelector('#phone') as HTMLInputElement).value).toBe(
      '(805) 555-1212',
    );

    fill(fixture, '#phone', '805');
    fill(fixture, '#first-name', 'Ada');
    fill(fixture, '#last-name', 'Lovelace');
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#phone-error')?.textContent).toContain(
      'Enter a 10-digit phone number.',
    );
    expect(fixture.nativeElement.querySelector('#phone')?.getAttribute('aria-invalid')).toBe(
      'true',
    );
    http.expectNone(personApiUrl('/me'));
  });

  it('rejects an email address that is not valid', () => {
    fill(fixture, '#first-name', 'Ada');
    fill(fixture, '#last-name', 'Lovelace');
    fill(fixture, '#profile-email', 'not-an-email');
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#email-error')?.textContent).toContain(
      'Enter a valid email address.',
    );
    http.expectNone(personApiUrl('/me'));
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
        phone: null,
        email: null,
        linkedIn: null,
        title: null,
        engineeringType: null,
        profilePictureUrl: null,
      });
      flushShared(http);
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

describe('profile contact', () => {
  it('formats partial numbers and accepts a blank email', () => {
    expect(formatPhone('805')).toBe('(805');
    expect(formatPhone('805555')).toBe('(805) 555');
    expect(formatPhone('+18055551212')).toBe('+1 (805) 555-1212');
    expect(internationalPhone('(805) 555-1212')).toBe('+1 (805) 555-1212');
    expect(internationalPhone('18055551212')).toBe('+1 (805) 555-1212');
    expect(internationalPhone('+1 (805) 555-1212')).toBe('+1 (805) 555-1212');
    expect(internationalPhone('')).toBe('');
    expect(internationalPhone('805')).toBe('805');
    expect(phoneError('(805) 555-1212')).toBeNull();
    expect(phoneError('')).toBeNull();
    expect(emailError('ada@example.org')).toBeNull();
    expect(emailError('')).toBeNull();
  });
});

function flushShared(http: HttpTestingController, userId: string | null = null): void {
  const path = userId ? `/${userId}/pictures` : '/me/pictures';
  http.expectOne(personApiUrl(path)).flush([]);
}

function fill(fixture: ComponentFixture<Profile>, selector: string, value: string): void {
  const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('Profile admin mode', () => {
  let fixture: ComponentFixture<Profile>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    history.replaceState({ claimToken: 'reset+token/=' }, '');
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideRouter([
          { path: '', component: Profile },
          { path: 'manage', component: Profile },
          { path: 'login', component: Profile },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ userId: 'user-2' }) },
            paramMap: of(convertToParamMap({ userId: 'user-2' })),
          },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    http = TestBed.inject(HttpTestingController);
    http.expectOne(accountApiUrl('/me')).flush({
      userId: 'user-1',
      email: 'admin@example.org',
      username: 'admin@example.org',
      roles: ['admin'],
    });
    http.match(personApiUrl('/me')).forEach((request) => {
      request.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
    http.expectOne(personApiUrl('/user-2')).flush({
      id: 'person-2',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      email: null,
      linkedIn: null,
      title: null,
      engineeringType: null,
      profilePictureUrl: null,
    });
    flushShared(http, 'user-2');
    const status = http.expectOne(memberApiUrl('/user-2'));
    expect(status.request.method).toBe('GET');
    status.flush({ claimed: false });
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    history.replaceState({}, '');
  });

  it('names the profile for the member and shows the claim link once', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const claimUrl = claimAccountUrl('user-2', 'reset+token/=');
    expect(compiled.querySelector('h1')?.textContent).toContain('Ada Profile (admin mode)');
    expect(compiled.textContent).toContain('Claim this account');
    expect(compiled.textContent).toContain(claimUrl);
    expect(compiled.textContent).toContain('valid for one day');
    expect(compiled.textContent).toContain('Copy to clipboard');
    expect(compiled.textContent).toContain('Generate claim link');
    const link = compiled.querySelector('.claim-link') as HTMLElement;
    expect(getComputedStyle(link).fontSize).toBe('1rem');
    expect(history.state?.claimToken).toBeUndefined();
    expect(
      [...compiled.querySelectorAll('button')].some(
        (button) => button.textContent?.trim() === 'Delete',
      ),
    ).toBe(true);
  });

  it('copies the claim link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const copy = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Copy to clipboard',
    ) as HTMLButtonElement;
    copy.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith(claimAccountUrl('user-2', 'reset+token/='));
    expect(fixture.nativeElement.textContent).toContain('Copied.');
  });

  it('copies the claim link when the clipboard api refuses', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    const copy = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Copy to clipboard',
    ) as HTMLButtonElement;
    copy.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(fixture.nativeElement.textContent).toContain('Copied.');
  });

  it('generates a new claim link for an unclaimed account', async () => {
    const generate = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Generate claim link',
    ) as HTMLButtonElement;
    generate.click();
    const request = http.expectOne(memberApiUrl('/user-2/claim-link'));
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer saved-token');
    request.flush({ token: 'fresh token' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(claimAccountUrl('user-2', 'fresh token'));
  });

  it('hides the claim link after the account is claimed', async () => {
    const generate = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Generate claim link',
    ) as HTMLButtonElement;
    generate.click();
    http
      .expectOne(memberApiUrl('/user-2/claim-link'))
      .flush(
        { message: 'This account has already been claimed.' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('This account has been claimed.');
    expect(compiled.querySelector('.claim-link')).toBeNull();
    expect(
      [...compiled.querySelectorAll('button')].some(
        (button) => button.textContent?.trim() === 'Generate claim link',
      ),
    ).toBe(false);
  });

  it('asks before deleting the member account', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButton = [...compiled.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Delete',
    ) as HTMLButtonElement;
    const heading = compiled.querySelector('#shared-pictures-heading');
    expect(
      heading !== null &&
        (deleteButton.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING) ===
          Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(true);
    deleteButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')?.textContent).toContain(
      "Delete Ada's profile and sign-in account?",
    );
    expect(fixture.nativeElement.textContent).toContain('Nothing is deleted until you confirm.');
    http.expectNone(memberApiUrl('/user-2'));

    const cancel = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Cancel',
    ) as HTMLButtonElement;
    cancel.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
    http.expectNone(memberApiUrl('/user-2'));

    deleteButton.click();
    fixture.detectChanges();
    const confirm = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Delete account',
    ) as HTMLButtonElement;
    confirm.click();
    const request = http.expectOne(memberApiUrl('/user-2'));
    expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('Authorization')).toBe('Bearer saved-token');
    request.flush(null);
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/manage');
  });
});

describe('Profile admin mode for a claimed account', () => {
  let fixture: ComponentFixture<Profile>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    history.replaceState({ claimToken: 'reset+token/=' }, '');
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideRouter([{ path: '', component: Profile }]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ userId: 'user-2' }) },
            paramMap: of(convertToParamMap({ userId: 'user-2' })),
          },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    http = TestBed.inject(HttpTestingController);
    http.expectOne(accountApiUrl('/me')).flush({
      userId: 'user-1',
      email: 'admin@example.org',
      username: 'admin@example.org',
      roles: ['admin'],
    });
    http.match(personApiUrl('/me')).forEach((request) => {
      request.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
    http.expectOne(personApiUrl('/user-2')).flush({
      id: 'person-2',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      email: null,
      linkedIn: null,
      title: null,
      engineeringType: null,
      profilePictureUrl: null,
    });
    flushShared(http, 'user-2');
    http.expectOne(memberApiUrl('/user-2')).flush({ claimed: true });
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    history.replaceState({}, '');
  });

  it('does not show a claim link for an account that is already claimed', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('This account has been claimed.');
    expect(compiled.querySelector('.claim-link')).toBeNull();
    expect(compiled.textContent).not.toContain('Generate claim link');
    expect(history.state?.claimToken).toBeUndefined();
  });
});
