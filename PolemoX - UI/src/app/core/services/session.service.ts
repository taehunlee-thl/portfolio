import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateSessionRequest,
  InviteView,
  LeaderboardView,
  SessionDetailView,
  SessionView,
} from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly base = `${environment.apiBaseUrl}/sessions`;

  constructor(private readonly http: HttpClient) {}

  create(request: CreateSessionRequest): Observable<SessionView> {
    return this.http.post<SessionView>(this.base, request);
  }

  mine(): Observable<SessionView[]> {
    return this.http.get<SessionView[]>(`${this.base}/mine`);
  }

  get(id: number): Observable<SessionDetailView> {
    return this.http.get<SessionDetailView>(`${this.base}/${id}`);
  }

  invite(sessionId: number, username: string): Observable<InviteView> {
    return this.http.post<InviteView>(`${this.base}/${sessionId}/invites`, { username });
  }

  joinByCode(joinCode: string): Observable<SessionDetailView> {
    return this.http.post<SessionDetailView>(`${this.base}/join/${joinCode}`, {});
  }

  /** Join an open battle straight from the public board — no code needed. */
  joinPublic(sessionId: number): Observable<SessionDetailView> {
    return this.http.post<SessionDetailView>(`${this.base}/${sessionId}/join`, {});
  }

  start(sessionId: number): Observable<SessionDetailView> {
    return this.http.post<SessionDetailView>(`${this.base}/${sessionId}/start`, {});
  }

  cancel(sessionId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${sessionId}/cancel`, {});
  }

  /**
   * Leave a battle. `seatFreed` is true when it was still a lobby (seat released, no record) and
   * false when the battle was running and the departure was recorded as a forfeit.
   */
  leave(sessionId: number): Observable<{ seatFreed: boolean }> {
    return this.http.post<{ seatFreed: boolean }>(`${this.base}/${sessionId}/leave`, {});
  }

  leaderboard(sessionId: number): Observable<LeaderboardView> {
    return this.http.get<LeaderboardView>(`${this.base}/${sessionId}/leaderboard`);
  }

  myInvites(): Observable<InviteView[]> {
    return this.http.get<InviteView[]>(`${environment.apiBaseUrl}/invites/mine`);
  }

  acceptInvite(inviteId: number): Observable<SessionDetailView> {
    return this.http.post<SessionDetailView>(`${environment.apiBaseUrl}/invites/${inviteId}/accept`, {});
  }

  declineInvite(inviteId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/invites/${inviteId}/decline`, {});
  }
}
