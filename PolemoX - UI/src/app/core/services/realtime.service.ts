import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, EMPTY, Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LeaderboardView, SessionStatus } from '../models/session.model';
import { TokenStorageService } from './token-storage.service';

export interface SessionStatusMessage {
  sessionId: number;
  status: SessionStatus;
}

/**
 * One shared STOMP client for the whole app, ref-counted so it connects lazily on the first
 * subscription and disconnects once the last one goes away.
 *
 * `connected$` tracks the client's live connect/disconnect state (STOMP.js auto-reconnects on
 * drop per `reconnectDelay`, which starts a brand new server-side session — any subscription made
 * before the drop is gone). Each `watch()` re-subscribes to its destination via `switchMap`
 * whenever `connected$` flips back to true, so a reconnect is transparent to callers instead of
 * silently going stale.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private client: Client | null = null;
  private readonly connected$ = new BehaviorSubject(false);
  private refCount = 0;

  constructor(private readonly tokens: TokenStorageService) {}

  watchLeaderboard(sessionId: number): Observable<LeaderboardView> {
    return this.watch<LeaderboardView>(`/topic/sessions/${sessionId}/leaderboard`);
  }

  watchStatus(sessionId: number): Observable<SessionStatusMessage> {
    return this.watch<SessionStatusMessage>(`/topic/sessions/${sessionId}/status`);
  }

  private watch<T>(destination: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      const client = this.acquire();

      const subscription = this.connected$
        .pipe(
          switchMap((isConnected) =>
            isConnected ? new Observable<IMessage>((s) => this.subscribeTo(client, destination, s)) : EMPTY,
          ),
        )
        .subscribe((message) => {
          try {
            subscriber.next(JSON.parse(message.body) as T);
          } catch {
            // Malformed frame — drop it rather than kill the whole stream.
          }
        });

      return () => {
        subscription.unsubscribe();
        this.release();
      };
    });
  }

  private subscribeTo(client: Client, destination: string, subscriber: { next: (m: IMessage) => void }) {
    const stompSub = client.subscribe(destination, (message) => subscriber.next(message));
    return () => stompSub.unsubscribe();
  }

  private acquire(): Client {
    this.refCount++;
    if (!this.client) {
      const client = new Client({
        brokerURL: environment.wsUrl,
        connectHeaders: { Authorization: `Bearer ${this.tokens.accessToken ?? ''}` },
        reconnectDelay: 4000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => this.connected$.next(true),
        onDisconnect: () => this.connected$.next(false),
        onWebSocketClose: () => this.connected$.next(false),
      });
      client.activate();
      this.client = client;
    }
    return this.client;
  }

  private release(): void {
    this.refCount--;
    if (this.refCount <= 0) {
      this.connected$.next(false);
      this.client?.deactivate();
      this.client = null;
    }
  }
}
