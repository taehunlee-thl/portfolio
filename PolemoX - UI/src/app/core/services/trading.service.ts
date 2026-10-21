import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccountView, PositionView, TradeRequest, TradeView } from '../models/trading.model';

@Injectable({ providedIn: 'root' })
export class TradingService {
  private readonly base = `${environment.apiBaseUrl}/accounts`;

  constructor(private readonly http: HttpClient) {}

  getAccount(accountId: number): Observable<AccountView> {
    return this.http.get<AccountView>(`${this.base}/${accountId}`);
  }

  placeOrder(accountId: number, request: TradeRequest): Observable<TradeView> {
    return this.http.post<TradeView>(`${this.base}/${accountId}/orders`, request);
  }

  positions(accountId: number): Observable<PositionView[]> {
    return this.http.get<PositionView[]>(`${this.base}/${accountId}/positions`);
  }

  trades(accountId: number): Observable<TradeView[]> {
    return this.http.get<TradeView[]>(`${this.base}/${accountId}/trades`);
  }
}
