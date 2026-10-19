import { WebsiteEvent } from './event-api';

const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/;

export function calendarFile(event: WebsiteEvent): string | null {
  const when = scheduleLines(event);
  if (!when) {
    return null;
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EWB-SBV//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@ewb-sbv.org`,
    `DTSTAMP:${stamp(new Date())}`,
    ...when,
  ];
  if (event.title) {
    lines.push(`SUMMARY:${escapeText(event.title)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }
  if (event.meetUrl) {
    lines.push(`DESCRIPTION:${escapeText(event.meetUrl)}`);
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return `${lines.flatMap(fold).join('\r\n')}\r\n`;
}

export function downloadCalendarFile(event: WebsiteEvent): void {
  const body = calendarFile(event);
  if (!body) {
    return;
  }

  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'event.ics';
  link.click();
  URL.revokeObjectURL(url);
}

function scheduleLines(event: WebsiteEvent): string[] | null {
  if (event.allDay) {
    const start = compactDate(event.startsOn);
    if (!start) {
      return null;
    }
    const inclusiveEnd = compactDate(event.endsOn) ?? start;
    const end = inclusiveEnd < start ? nextDate(start) : nextDate(inclusiveEnd);
    return [`DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`];
  }

  const start = event.startsAt ? stamp(new Date(event.startsAt)) : null;
  if (!start) {
    return null;
  }
  const end = event.endsAt ? stamp(new Date(event.endsAt)) : start;
  return [`DTSTART:${start}`, `DTEND:${end ?? start}`];
}

function compactDate(value: string | null): string | null {
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
  return `${match[1]}${match[2]}${match[3]}`;
}

function nextDate(compact: string): string {
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6));
  const day = Number(compact.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}${nextMonth}${nextDay}`;
}

function stamp(date: Date): string | null {
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function fold(line: string): string[] {
  if (line.length <= 75) {
    return [line];
  }
  const parts = [line.slice(0, 75)];
  let index = 75;
  while (index < line.length) {
    parts.push(` ${line.slice(index, index + 74)}`);
    index += 74;
  }
  return parts;
}
