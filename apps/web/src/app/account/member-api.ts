import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api-url';

export type MemberRole = 'admin' | 'officer' | 'member';

export interface RosterMember {
  userId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: MemberRole;
}

export interface CreatedMember extends RosterMember {
  claimToken: string;
}

export interface MemberClaimStatus {
  claimed: boolean;
}

export interface ClaimLinkResponse {
  token: string;
}

export interface ChangedMemberRole {
  userId: string;
  role: MemberRole;
}

export interface CreateMemberInput {
  username: string;
  firstName: string;
  lastName: string;
}

export function memberApiUrl(path = ''): string {
  return `${apiUrl.replace(/\/$/, '')}/api/members${path}`;
}

export function rosterName(
  member: Pick<RosterMember, 'firstName' | 'lastName' | 'username'>,
): string {
  const last = member.lastName?.trim() ?? '';
  const first = member.firstName?.trim() ?? '';
  if (last && first) {
    return `${last}, ${first}`;
  }
  return last || first || member.username;
}

@Injectable({ providedIn: 'root' })
export class MemberApi {
  private readonly http = inject(HttpClient);

  list(): Observable<RosterMember[]> {
    return this.http.get<RosterMember[]>(memberApiUrl());
  }

  create(input: CreateMemberInput): Observable<CreatedMember> {
    return this.http.post<CreatedMember>(memberApiUrl(), input);
  }

  delete(userId: string): Observable<void> {
    return this.http.delete<void>(memberApiUrl(`/${encodeURIComponent(userId)}`));
  }

  status(userId: string): Observable<MemberClaimStatus> {
    return this.http.get<MemberClaimStatus>(memberApiUrl(`/${encodeURIComponent(userId)}`));
  }

  changeRole(userId: string, role: MemberRole): Observable<ChangedMemberRole> {
    return this.http.patch<ChangedMemberRole>(memberApiUrl(`/${encodeURIComponent(userId)}/role`), {
      role,
    });
  }

  claimLink(userId: string): Observable<ClaimLinkResponse> {
    return this.http.post<ClaimLinkResponse>(
      memberApiUrl(`/${encodeURIComponent(userId)}/claim-link`),
      {},
    );
  }
}
