import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PriceQuote, TickerPage } from '../models/trading.model';

@Injectable({ providedIn: 'root' })
export class PriceService {
  constructor(private readonly http: HttpClient) {}

  getPrice(symbol: string): Observable<PriceQuote> {
    return this.http.get<PriceQuote>(`${environment.apiBaseUrl}/prices/${symbol}`);
  }

  searchStocks(search: string, limit = 12): Observable<TickerPage> {
    return this.http.get<TickerPage>(`${environment.apiBaseUrl}/stocks`, {
      params: { search, market: 'stocks', limit },
    });
  }
}
