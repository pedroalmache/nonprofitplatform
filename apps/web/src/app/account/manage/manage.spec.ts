import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { accessTokenStorageKey, accountApiUrl } from '../account-api';
import { authInterceptor } from '../auth.interceptor';
import { eventApiUrl } from '../event-api';
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
    http.expectOne(eventApiUrl()).flush([]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('shows event management and keeps Manage beside the account control', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent).toContain('Manage');
    expect(compiled.textContent).toContain('Chapter events');
    expect(compiled.textContent).toContain('+ Add Event');
    expect(compiled.querySelector('table')).toBeNull();

    const desktop = compiled.querySelector('.desktop-nav');
    const links = [...(desktop?.querySelectorAll('a') ?? [])].map((link) => link.textContent?.trim());
    const manageIndex = links.indexOf('Manage');
    const accountIndex = links.indexOf('officer@example.org');
    expect(manageIndex).toBeGreaterThan(-1);
    expect(accountIndex).toBe(manageIndex + 1);
  });
});
