import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api-url';

export interface DirectoryProfile {
  id: string;
  fullName: string;
  profilePictureUrl: string | null;
  linkedIn: string | null;
  engineeringType: string | null;
  title: string | null;
  phone?: string | null;
  email?: string | null;
  sharedPictureCount: number;
}

export interface SharedAlbumPicture {
  id: string;
  url: string;
}

export interface SharedAlbum {
  fullName: string;
  pictures: SharedAlbumPicture[];
}

export function directoryApiUrl(path = ''): string {
  return `${apiUrl.replace(/\/$/, '')}/api/directory${path}`;
}

export function linkedInHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

@Injectable({ providedIn: 'root' })
export class DirectoryApi {
  private readonly http = inject(HttpClient);

  list(): Observable<DirectoryProfile[]> {
    return this.http.get<DirectoryProfile[]>(directoryApiUrl());
  }

  pictures(personId: string): Observable<SharedAlbum> {
    return this.http.get<SharedAlbum>(directoryApiUrl(`/${encodeURIComponent(personId)}/pictures`));
  }
}
