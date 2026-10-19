import { WebsiteEvent } from './event-api';
import { calendarFile } from './calendar-file';

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

describe('calendarFile', () => {
  it('writes a timed event in UTC', () => {
    const file = calendarFile(meeting);

    expect(file).toContain('BEGIN:VCALENDAR');
    expect(file).toContain('UID:event-1@ewb-sbv.org');
    expect(file).toContain('DTSTART:20261016T010000Z');
    expect(file).toContain('DTEND:20261016T023000Z');
    expect(file).toContain('SUMMARY:Monthly Chapter Meeting');
    expect(file).toContain('LOCATION:Ventura Community Center');
    expect(file).toContain('DESCRIPTION:https://meet.google.com/abc-defg-hij');
    expect(file).not.toContain('eid=');
  });

  it('writes an all-day span with an exclusive end', () => {
    const file = calendarFile({
      ...meeting,
      title: 'Retreat, day one',
      allDay: true,
      startsAt: null,
      endsAt: null,
      startsOn: '2026-10-13',
      endsOn: '2026-10-15',
      meetUrl: null,
      location: null,
    });

    expect(file).toContain('DTSTART;VALUE=DATE:20261013');
    expect(file).toContain('DTEND;VALUE=DATE:20261016');
    expect(file).toContain('SUMMARY:Retreat\\, day one');
    expect(file).not.toContain('DESCRIPTION:');
  });

  it('returns nothing when the event has no schedule', () => {
    expect(calendarFile({ ...meeting, allDay: false, startsAt: null, endsAt: null })).toBeNull();
  });
});
