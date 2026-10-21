import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FeaturedBattleView,
  LiveSessionView,
  MarketPulseView,
  PlatformStatsView,
  RankingBoardView,
  RankingCategory,
  SessionTradeView,
  TraderProfileView,
  TrendingSectorView,
  TrendingSymbolActivityView,
} from '../models/discovery.model';
import { UserSummary } from '../models/user.model';

/**
 * The anonymous half of the API — everything the landing page needs before anyone signs in.
 * Kept separate from {@link SessionService} so it's obvious at a glance which calls carry a token
 * and which don't.
 */
@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/public`;

  market(): Observable<MarketPulseView> {
    return this.http.get<MarketPulseView>(`${this.base}/market`);
  }

  publicSessions(): Observable<LiveSessionView[]> {
    return this.http.get<LiveSessionView[]>(`${this.base}/sessions`);
  }

  /** Headline battles for the home hero, each with the history needed to chart it. */
  featured(limit = 5): Observable<FeaturedBattleView[]> {
    return this.http.get<FeaturedBattleView[]>(`${this.base}/featured`, {
      params: new HttpParams().set('limit', limit),
    });
  }

  rankings(category: RankingCategory, limit = 20): Observable<RankingBoardView> {
    const params = new HttpParams().set('category', category).set('limit', limit);
    return this.http.get<RankingBoardView>(`${this.base}/rankings`, { params });
  }

  stats(): Observable<PlatformStatsView> {
    return this.http.get<PlatformStatsView>(`${this.base}/stats`);
  }

  /** What PolemoX's own traders are trading — not external market data. */
  trendingSymbols(limit = 6): Observable<TrendingSymbolActivityView[]> {
    return this.http.get<TrendingSymbolActivityView[]>(`${this.base}/activity/symbols`, {
      params: new HttpParams().set('limit', limit),
    });
  }

  trendingSectors(limit = 5): Observable<TrendingSectorView[]> {
    return this.http.get<TrendingSectorView[]>(`${this.base}/activity/sectors`, {
      params: new HttpParams().set('limit', limit),
    });
  }

  /** Live fills for a public battle, newest first. */
  sessionTape(sessionId: number, limit = 40): Observable<SessionTradeView[]> {
    return this.http.get<SessionTradeView[]>(`${this.base}/sessions/${sessionId}/tape`, {
      params: new HttpParams().set('limit', limit),
    });
  }

  trader(username: string): Observable<TraderProfileView> {
    return this.http.get<TraderProfileView>(`${this.base}/traders/${encodeURIComponent(username)}`);
  }

  searchTraders(query: string): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.base}/traders`, {
      params: new HttpParams().set('q', query),
    });
  }
}
