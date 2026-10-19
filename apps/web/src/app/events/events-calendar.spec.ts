import { WebsiteEvent } from '../account/event-api';
import { buildMonth, initialView } from './events-calendar';

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

describe('events calendar', () => {
  it('builds a Sunday-first month and places an event on its date', () => {
    const month = buildMonth(2026, 9, [meeting], '2026-10-05');

    expect(month.label).toBe('October 2026');
    expect(month.weeks.length).toBe(6);
    expect(month.weeks[0].days[0].date).toBe('2026-09-27');
    expect(month.weeks[0].days[0].inMonth).toBe(false);
    expect(month.weeks[0].days[4].date).toBe('2026-10-01');
    expect(month.weeks[0].days[4].inMonth).toBe(true);

    const today = month.weeks.flatMap((week) => week.days).find((day) => day.date === '2026-10-05');
    const eventDay = month.weeks
      .flatMap((week) => week.days)
      .find((day) => day.date === '2026-10-15');
    expect(today?.isToday).toBe(true);
    expect(eventDay?.events.map((event) => event.id)).toEqual(['event-1']);
    expect(eventDay?.isToday).toBe(false);
  });

  it('repeats a multi-day event across each covered day', () => {
    const retreat: WebsiteEvent = {
      ...meeting,
      id: 'retreat',
      title: 'Retreat',
      startsOn: '2026-10-13',
      endsOn: '2026-10-15',
    };
    const month = buildMonth(
      2026,
      9,
      [retreat, { ...meeting, startsOn: null, endsOn: null }],
      '2026-10-05',
    );
    const placed = month.weeks
      .flatMap((week) => week.days)
      .filter((day) => day.events.some((event) => event.id === 'retreat'))
      .map((day) => day.date);

    expect(placed).toEqual(['2026-10-13', '2026-10-14', '2026-10-15']);
  });

  it('opens on the next event, then the earliest event, then today', () => {
    expect(initialView([meeting], '2026-10-05')).toEqual({ year: 2026, monthIndex: 9 });
    expect(initialView([meeting], '2026-11-01')).toEqual({ year: 2026, monthIndex: 9 });
    expect(initialView([], '2026-10-05')).toEqual({ year: 2026, monthIndex: 9 });
  });
});
