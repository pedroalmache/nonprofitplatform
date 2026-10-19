import { WebsiteEvent } from '../account/event-api';

const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  events: WebsiteEvent[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  monthIndex: number;
  label: string;
  weeks: CalendarWeek[];
}

export interface CalendarView {
  year: number;
  monthIndex: number;
}

export function localIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function initialView(events: WebsiteEvent[], todayIso: string): CalendarView {
  const starts = events
    .map((event) => eventSpan(event)?.start)
    .filter((date): date is string => date !== undefined)
    .sort();
  const chosen = starts.find((date) => date >= todayIso) ?? starts[0] ?? todayIso;
  return viewFromIso(chosen);
}

export function buildMonth(
  year: number,
  monthIndex: number,
  events: WebsiteEvent[],
  todayIso: string,
): CalendarMonth {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const gridStart = new Date(Date.UTC(year, monthIndex, 1 - first.getUTCDay()));
  const weeks: CalendarWeek[] = [];

  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const date = new Date(gridStart);
      date.setUTCDate(gridStart.getUTCDate() + week * 7 + weekday);
      const iso = date.toISOString().slice(0, 10);
      days.push({
        date: iso,
        day: date.getUTCDate(),
        inMonth: date.getUTCMonth() === monthIndex && date.getUTCFullYear() === year,
        isToday: iso === todayIso,
        events: events.filter((event) => covers(event, iso)),
      });
    }
    weeks.push({ days });
  }

  return {
    year,
    monthIndex,
    label: first.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    weeks,
  };
}

function viewFromIso(iso: string): CalendarView {
  const match = isoDate.exec(iso);
  if (!match) {
    return { year: 1970, monthIndex: 0 };
  }
  return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
}

function eventSpan(event: WebsiteEvent): { start: string; end: string } | null {
  const start = normalizeIso(event.startsOn);
  if (!start) {
    return null;
  }
  const end = normalizeIso(event.endsOn) ?? start;
  return { start, end: end < start ? start : end };
}

function covers(event: WebsiteEvent, iso: string): boolean {
  const span = eventSpan(event);
  return span !== null && iso >= span.start && iso <= span.end;
}

function normalizeIso(value: string | null): string | null {
  const match = value ? isoDate.exec(value) : null;
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}
