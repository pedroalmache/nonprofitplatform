import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api-url';

export interface PersonProfile {
  id: string;
  firstName: string;
  lastName: string;
}

export interface PersonInput {
  firstName: string;
  lastName: string;
}

export function personApiUrl(path: string): string {
  return `${apiUrl.replace(/\/$/, '')}/api/people${path}`;
}

@Injectable({ providedIn: 'root' })
export class PersonApi {
  private readonly http = inject(HttpClient);

  mine(): Observable<PersonProfile> {
    return this.http.get<PersonProfile>(personApiUrl('/me'));
  }

  save(input: PersonInput): Observable<PersonProfile> {
    return this.http.put<PersonProfile>(personApiUrl('/me'), input);
  }
}
