import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { accessTokenStorageKey, accountApiUrl } from '../account/account-api';
import { authInterceptor } from '../account/auth.interceptor';
import { personApiUrl } from '../account/person-api';
import { directoryApiUrl, linkedInHref } from './directory-api';
import { Directory } from './directory';

const ada = {
  id: 'person-1',
  fullName: 'Ada Lovelace',
  profilePictureUrl: 'https://files.example/ada.webp',
  linkedIn: 'https://www.linkedin.com/in/example',
  engineeringType: 'Civil',
  title: 'Engineer',
  phone: '(805) 555-1212',
  email: 'ada@example.org',
  sharedPictureCount: 0,
};

describe('Directory', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('hides phone and email until someone is signed in', async () => {
    const { fixture, http } = await create();
    http.expectOne(directoryApiUrl()).flush([ada]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent).toContain('Directory');
    expect(compiled.querySelector('.section-intro')).toBeNull();
    expect(compiled.textContent).not.toContain(
      'Phone numbers and email addresses are visible after you sign in.',
    );
    expect(compiled.querySelectorAll('.directory-card').length).toBe(1);
    expect(compiled.querySelector('.directory-card h2')?.textContent).toContain('Ada Lovelace');
    const labels = [...compiled.querySelectorAll('dt')].map((cell) => cell.textContent?.trim());
    expect(labels).toEqual(['Engineering', 'Title']);
    expect(compiled.textContent).not.toContain('(805) 555-1212');
    expect(compiled.textContent).not.toContain('ada@example.org');
    expect(compiled.textContent).not.toContain('https://www.linkedin.com/in/example');
    expect(compiled.querySelector('.directory-photo')?.getAttribute('src')).toBe(
      ada.profilePictureUrl,
    );
    expect(compiled.querySelector('.directory-photo')?.getAttribute('alt')).toBe('');
    const link = compiled.querySelector('a.directory-linkedin');
    expect(link?.getAttribute('href')).toBe('https://www.linkedin.com/in/example');
    expect(link?.getAttribute('rel')).toContain('noopener');
    expect(link?.getAttribute('aria-label')).toBe('Ada Lovelace on LinkedIn');
    expect(link?.querySelector('svg')).not.toBeNull();
    const directoryLink = [...compiled.querySelectorAll('.desktop-nav a')].find(
      (item) => item.textContent?.trim() === 'Directory',
    );
    expect(directoryLink?.getAttribute('href')).toBe('/directory');
    http.verify();
  });

  it('shows phone and email for a signed-in member', async () => {
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    const { fixture, http } = await create();
    http.expectOne(accountApiUrl('/me')).flush({
      email: 'member@example.org',
      username: 'member@example.org',
      roles: ['member'],
    });
    http.match(personApiUrl('/me')).forEach((request) => {
      request.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
    await Promise.resolve();
    fixture.detectChanges();
    const directory = http.expectOne(directoryApiUrl());
    expect(directory.request.headers.get('Authorization')).toBe('Bearer saved-token');
    directory.flush([ada]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const labels = [...compiled.querySelectorAll('.directory-card dt')].map((cell) =>
      cell.textContent?.trim(),
    );
    expect(labels).toEqual(['Engineering', 'Title', 'Phone', 'Email']);
    expect(compiled.querySelector('a.directory-linkedin svg')).not.toBeNull();
    const phone = [...compiled.querySelectorAll('.directory-card dt')]
      .find((label) => label.textContent?.trim() === 'Phone')
      ?.parentElement?.querySelector('dd')
      ?.textContent?.trim();
    expect(phone).toBe('+1 (805) 555-1212');
    expect(compiled.textContent).toContain('ada@example.org');
    expect(compiled.querySelector('.directory-album')).toBeNull();
    http.verify();
  });

  it('opens a picture wall when a member has shared pictures', async () => {
    const { fixture, http } = await create();
    http.expectOne(directoryApiUrl()).flush([{ ...ada, sharedPictureCount: 2 }]);
    fixture.detectChanges();

    const open = fixture.nativeElement.querySelector('.directory-album') as HTMLButtonElement;
    expect(open.getAttribute('aria-label')).toBe('View Ada Lovelace shared pictures');
    open.click();
    fixture.detectChanges();

    const album = http.expectOne(directoryApiUrl('/person-1/pictures'));
    expect(album.request.method).toBe('GET');
    album.flush({
      fullName: 'Ada Lovelace',
      pictures: [
        { id: 'pic-1', url: 'https://files.example/one.webp' },
        { id: 'pic-2', url: 'https://files.example/two.webp' },
      ],
    });
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.querySelector('h2')?.textContent).toContain("Ada Lovelace's pictures");
    expect(dialog.querySelectorAll('.polaroid').length).toBe(2);
    (dialog.querySelector('.polaroid') as HTMLButtonElement).click();
    fixture.detectChanges();
    const back = [...dialog.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Back to the wall',
    );
    expect(back).toBeTruthy();
    const close = [...dialog.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Close',
    ) as HTMLButtonElement;
    close.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    http.verify();
  });

  it('lists members alphabetically and filters while typing', async () => {
    const { fixture, http } = await create();
    http
      .expectOne(directoryApiUrl())
      .flush([
        {
          ...ada,
          id: 'ben',
          fullName: 'Ben Lovelace',
          title: 'Surveyor',
          engineeringType: 'Civil',
        },
        {
          ...ada,
          id: 'zoe',
          fullName: 'Zoe Adams',
          title: 'Hydrologist',
          engineeringType: 'Water',
        },
        ada,
      ]);
    fixture.detectChanges();

    const names = (): string[] =>
      [...fixture.nativeElement.querySelectorAll('.directory-card h2')].map(
        (heading) => heading.textContent?.trim() ?? '',
      );
    expect(names()).toEqual(['Zoe Adams', 'Ada Lovelace', 'Ben Lovelace']);
    expect(
      fixture.nativeElement.querySelector('label[for="directory-search"]')?.textContent,
    ).toContain('Search');

    const input = fixture.nativeElement.querySelector('#directory-search') as HTMLInputElement;
    input.value = 'Lovelace';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(names()).toEqual(['Ada Lovelace', 'Ben Lovelace']);

    input.value = 'surveyor';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(names()).toEqual(['Ben Lovelace']);

    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(names()).toEqual(['Zoe Adams', 'Ada Lovelace', 'Ben Lovelace']);

    input.value = 'nomatch';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(names()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No one matches that search.');
    http.verify();
  });
});

describe('linkedInHref', () => {
  it('links only http and https addresses', () => {
    expect(linkedInHref('https://www.linkedin.com/in/example')).toBe(
      'https://www.linkedin.com/in/example',
    );
    expect(linkedInHref('javascript:alert(1)')).toBeNull();
    expect(linkedInHref('')).toBeNull();
  });
});

async function create(): Promise<{
  fixture: ComponentFixture<Directory>;
  http: HttpTestingController;
}> {
  await TestBed.configureTestingModule({
    imports: [Directory],
    providers: [
      provideRouter([
        { path: 'directory', component: Directory },
        { path: 'login', component: Directory },
      ]),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(Directory);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  return { fixture, http };
}
