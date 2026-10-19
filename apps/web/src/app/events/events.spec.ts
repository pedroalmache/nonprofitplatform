import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { accessTokenStorageKey, accountApiUrl } from '../account/account-api';
import { authInterceptor } from '../account/auth.interceptor';
import { eventApiUrl, WebsiteEvent } from '../account/event-api';
import { personApiUrl } from '../account/person-api';
import { Events } from './events';

const meeting: WebsiteEvent = {
  id: 'event-1',
  title: 'Monthly Chapter Meeting',
  dateLabel: 'October 15, 2026',
  timeLabel: '6:00 PM - 7:30 PM',
  startsOn: '2026-10-15',
  endsOn: '2026-10-15',
  startsAt: '2026-10-16T01:00:00.000Z',
  endsAt: '2026-10-16T02:30:00.000Z',
  allDay: false,
  location: 'Ventura Community Center',
  meetUrl: 'https://meet.google.com/abc-defg-hij',
  visibility: 'public',
  unavailable: false,
  ended: false,
};

describe('Events', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('lists upcoming public events and links Events in the menu', async () => {
    const { fixture, http } = await create();
    const request = http.expectOne(eventApiUrl());
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([meeting]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent).toContain('Events');
    expect(compiled.querySelector('h2')?.textContent).toContain('October 2026');
    const day = compiled.querySelector('time[datetime="2026-10-15"]')?.closest('td');
    const chip = day?.querySelector('button') as HTMLButtonElement;
    expect(chip?.textContent).toContain('Monthly Chapter Meeting');
    expect(chip?.textContent).toContain('Public');
    expect(chip?.getAttribute('aria-pressed')).toBe('false');
    expect(compiled.querySelector('[role="dialog"]')).toBeNull();
    chip.click();
    fixture.detectChanges();

    const dialog = compiled.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.textContent).toContain('October 15, 2026');
    expect(dialog?.textContent).toContain('6:00 PM - 7:30 PM');
    expect(dialog?.textContent).toContain('Ventura Community Center');
    expect(
      dialog?.querySelector('a[href="https://meet.google.com/abc-defg-hij"]')?.textContent,
    ).toContain('Google Meet');
    const add = [...(dialog?.querySelectorAll('button') ?? [])].find(
      (button) => button.textContent?.trim() === 'Add to your calendar',
    );
    expect(add).toBeTruthy();
    expect(compiled.textContent).not.toContain('Open in Google Calendar');
    expect(compiled.textContent).not.toContain('GoogleCalendarId');
    expect(compiled.textContent).not.toContain('GoogleEventId');

    const close = [...(dialog?.querySelectorAll('button') ?? [])].find(
      (button) => button.textContent?.trim() === 'Close',
    ) as HTMLButtonElement;
    close.click();
    fixture.detectChanges();
    expect(compiled.querySelector('[role="dialog"]')).toBeNull();

    const next = [...compiled.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Next',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();
    expect(compiled.querySelector('h2')?.textContent).toContain('November 2026');
    expect(compiled.querySelector('time[datetime="2026-10-15"]')).toBeNull();

    const menuOrder = [
      'Chapter Story',
      'Expeditions',
      'How We Work',
      'Get Involved',
      'Where We Stand',
      'Events',
      'Directory',
    ];
    const desktop = [...compiled.querySelectorAll('.desktop-nav a')].map((link) =>
      link.textContent?.trim(),
    );
    expect(desktop.slice(0, menuOrder.length)).toEqual(menuOrder);
    expect(desktop[menuOrder.length]).toBe('Sign in');
    const menuToggle = compiled.querySelector('.mobile-menu-toggle') as HTMLButtonElement;
    menuToggle.click();
    fixture.detectChanges();
    const mobile = [...compiled.querySelectorAll('.mobile-nav-link')].map((link) =>
      link.textContent?.trim(),
    );
    expect(mobile.slice(0, menuOrder.length)).toEqual(menuOrder);
    http.verify();
  });

  it('shows private events for a signed-in member', async () => {
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

    const request = http.expectOne(eventApiUrl());
    expect(request.request.headers.get('Authorization')).toBe('Bearer saved-token');
    request.flush([{ ...meeting, visibility: 'private' }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Private');
    expect(fixture.nativeElement.textContent).toContain('Monthly Chapter Meeting');
    http.verify();
  });

  it('shows an empty calendar', async () => {
    const { fixture, http } = await create();
    http.expectOne(eventApiUrl()).flush([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('Events');
    expect(compiled.querySelector('.month-calendar')).not.toBeNull();
    expect(compiled.querySelectorAll('.month-calendar tbody td').length).toBe(42);
    expect(text).not.toContain('Upcoming events are read from Google Calendar.');
    expect(text).not.toContain('No upcoming events are on the website.');
    http.verify();
  });
});

async function create(): Promise<{
  fixture: ComponentFixture<Events>;
  http: HttpTestingController;
}> {
  await TestBed.configureTestingModule({
    imports: [Events],
    providers: [
      provideRouter([
        { path: 'events', component: Events },
        { path: 'login', component: Events },
      ]),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(Events);
  fixture.detectChanges();
  return { fixture, http: TestBed.inject(HttpTestingController) };
}
