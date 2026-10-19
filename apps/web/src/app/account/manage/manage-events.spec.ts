import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { accessTokenStorageKey } from '../account-api';
import { authInterceptor } from '../auth.interceptor';
import { eventApiUrl, WebsiteEvent } from '../event-api';
import { ManageEvents } from './manage-events';

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
  meetUrl: null,
  visibility: 'public',
  unavailable: false,
  ended: false,
};

describe('ManageEvents', () => {
  let fixture: ComponentFixture<ManageEvents>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem(accessTokenStorageKey, 'saved-token');
    await TestBed.configureTestingModule({
      imports: [ManageEvents],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageEvents);
    http = TestBed.inject(HttpTestingController);
    http.expectOne(eventApiUrl()).flush([meeting]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('lists an upcoming event without google ids', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Monthly Chapter Meeting');
    expect(compiled.textContent).toContain('October 15, 2026');
    expect(compiled.textContent).toContain('6:00 PM - 7:30 PM');
    expect(compiled.textContent).toContain('Ventura Community Center');
    expect(compiled.textContent).toContain('Public');
    const add = [...compiled.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Add to your calendar',
    );
    expect(add).toBeTruthy();
    expect(compiled.textContent).not.toContain('Open in Google Calendar');
    expect(compiled.textContent).not.toContain('GoogleCalendarId');
    expect(compiled.textContent).not.toContain('GoogleEventId');
  });

  it('finds a google calendar event and adds it to the website', () => {
    openAdd(fixture);
    fill(fixture, '#event-link', 'https://calendar.google.com/calendar/event?eid=abc');
    const publicChoice = fixture.nativeElement.querySelector(
      'input[value="public"]',
    ) as HTMLInputElement;
    publicChoice.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('.dialog-panel form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    const preview = http.expectOne(eventApiUrl('/preview'));
    expect(preview.request.method).toBe('POST');
    expect(preview.request.body).toEqual({
      link: 'https://calendar.google.com/calendar/event?eid=abc',
      visibility: 'public',
    });
    preview.flush({
      title: 'Monthly Chapter Meeting',
      dateLabel: 'October 15, 2026',
      timeLabel: '6:00 PM - 7:30 PM',
      location: 'Ventura Community Center',
      meetUrl: null,
      visibility: 'public',
      upcoming: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Add to Website');

    const add = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Add to Website',
    ) as HTMLButtonElement;
    add.click();
    const created = http.expectOne(eventApiUrl());
    expect(created.request.method).toBe('POST');
    created.flush({ ...meeting, id: 'event-2' });
    const refreshed = http.expectOne(eventApiUrl());
    expect(refreshed.request.method).toBe('GET');
    refreshed.flush([meeting, { ...meeting, id: 'event-2' }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Monthly Chapter Meeting');
  });

  it('changes visibility and removes the website event', () => {
    const edit = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Edit visibility',
    ) as HTMLButtonElement;
    edit.click();
    fixture.detectChanges();
    const privateChoice = fixture.nativeElement.querySelector(
      'input[value="private"]',
    ) as HTMLInputElement;
    privateChoice.dispatchEvent(new Event('change'));
    const form = fixture.nativeElement.querySelector('.dialog-panel form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    const update = http.expectOne(eventApiUrl('/event-1'));
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ visibility: 'private' });
    update.flush({ ...meeting, visibility: 'private' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Private');

    const remove = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Remove from website',
    ) as HTMLButtonElement;
    remove.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'The Google Calendar event stays in Google Calendar.',
    );
    const confirm = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) =>
        button.textContent?.trim() === 'Remove from website' &&
        button.closest('[role="alertdialog"]'),
    ) as HTMLButtonElement;
    confirm.click();
    const deleted = http.expectOne(eventApiUrl('/event-1'));
    expect(deleted.request.method).toBe('DELETE');
    deleted.flush(null);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).not.toContain('Monthly Chapter Meeting');
    expect(text).not.toContain('No upcoming events are on the website.');
  });
});

function openAdd(fixture: ComponentFixture<ManageEvents>): void {
  const add = [...fixture.nativeElement.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === '+ Add Event',
  ) as HTMLButtonElement;
  add.click();
  fixture.detectChanges();
}

function fill(fixture: ComponentFixture<ManageEvents>, selector: string, value: string): void {
  const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}
