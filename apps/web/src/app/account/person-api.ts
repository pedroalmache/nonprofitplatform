import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api-url';

export interface SharedPicture {
  id: string;
  url: string;
}

export interface PersonProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  linkedIn: string | null;
  title: string | null;
  engineeringType: string | null;
  profilePictureUrl: string | null;
}

export interface PersonInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  linkedIn: string;
  title: string;
  engineeringType: string;
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

  savePicture(file: File): Observable<PersonProfile> {
    const body = new FormData();
    body.set('file', file);
    return this.http.put<PersonProfile>(personApiUrl('/me/picture'), body);
  }

  removePicture(): Observable<PersonProfile> {
    return this.http.delete<PersonProfile>(personApiUrl('/me/picture'));
  }

  sharedPictures(): Observable<SharedPicture[]> {
    return this.http.get<SharedPicture[]>(personApiUrl('/me/pictures'));
  }

  addSharedPicture(file: File): Observable<SharedPicture> {
    const body = new FormData();
    body.set('file', file);
    return this.http.post<SharedPicture>(personApiUrl('/me/pictures'), body);
  }

  removeSharedPicture(pictureId: string): Observable<void> {
    return this.http.delete<void>(personApiUrl(`/me/pictures/${encodeURIComponent(pictureId)}`));
  }

  forUser(userId: string): Observable<PersonProfile> {
    return this.http.get<PersonProfile>(personApiUrl(`/${encodeURIComponent(userId)}`));
  }

  saveForUser(userId: string, input: PersonInput): Observable<PersonProfile> {
    return this.http.put<PersonProfile>(personApiUrl(`/${encodeURIComponent(userId)}`), input);
  }

  savePictureForUser(userId: string, file: File): Observable<PersonProfile> {
    const body = new FormData();
    body.set('file', file);
    return this.http.put<PersonProfile>(
      personApiUrl(`/${encodeURIComponent(userId)}/picture`),
      body,
    );
  }

  removePictureForUser(userId: string): Observable<PersonProfile> {
    return this.http.delete<PersonProfile>(personApiUrl(`/${encodeURIComponent(userId)}/picture`));
  }

  sharedPicturesForUser(userId: string): Observable<SharedPicture[]> {
    return this.http.get<SharedPicture[]>(personApiUrl(`/${encodeURIComponent(userId)}/pictures`));
  }

  addSharedPictureForUser(userId: string, file: File): Observable<SharedPicture> {
    const body = new FormData();
    body.set('file', file);
    return this.http.post<SharedPicture>(
      personApiUrl(`/${encodeURIComponent(userId)}/pictures`),
      body,
    );
  }

  removeSharedPictureForUser(userId: string, pictureId: string): Observable<void> {
    return this.http.delete<void>(
      personApiUrl(`/${encodeURIComponent(userId)}/pictures/${encodeURIComponent(pictureId)}`),
    );
  }
}
