import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api-url';

export type EventVisibility = 'public' | 'private';

export interface WebsiteEvent {
  id: string;
  title: string | null;
  dateLabel: string | null;
  timeLabel: string | null;
  startsOn: string | null;
  endsOn: string | null;
  startsAt: string | null;
  endsAt: string | null;
  allDay: boolean;
  location: string | null;
  meetUrl: string | null;
  visibility: EventVisibility;
  unavailable: boolean;
  ended: boolean;
}

export interface EventPreview {
  title: string;
  dateLabel: string;
  timeLabel: string | null;
  location: string | null;
  meetUrl: string | null;
  visibility: EventVisibility;
  upcoming: boolean;
}

export interface EventLinkInput {
  link: string;
  visibility: EventVisibility;
}

export function eventApiUrl(path = ''): string {
  return `${apiUrl.replace(/\/$/, '')}/api/events${path}`;
}

@Injectable({ providedIn: 'root' })
export class EventApi {
  private readonly http = inject(HttpClient);

  list(): Observable<WebsiteEvent[]> {
    return this.http.get<WebsiteEvent[]>(eventApiUrl());
  }

  preview(input: EventLinkInput): Observable<EventPreview> {
    return this.http.post<EventPreview>(eventApiUrl('/preview'), input);
  }

  add(input: EventLinkInput): Observable<WebsiteEvent> {
    return this.http.post<WebsiteEvent>(eventApiUrl(), input);
  }

  changeVisibility(id: string, visibility: EventVisibility): Observable<WebsiteEvent> {
    return this.http.patch<WebsiteEvent>(eventApiUrl(`/${encodeURIComponent(id)}`), { visibility });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(eventApiUrl(`/${encodeURIComponent(id)}`));
  }
}
