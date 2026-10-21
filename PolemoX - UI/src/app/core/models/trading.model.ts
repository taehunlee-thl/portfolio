export type TradeSide = 'BUY' | 'SELL';

export interface AccountView {
  id: number;
  ownerId: string;
  balance: number;
  currency: string;
  mock: boolean;
  createdAt: string;
}

export interface PositionView {
  symbol: string;
  quantity: number;
  averageCost: number;
}

export interface TradeView {
  id: number;
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
  totalAmount: number;
  mock: boolean;
  executedAt: string;
}

export interface TradeRequest {
  symbol: string;
  side: TradeSide;
  quantity: number;
}

export interface PriceQuote {
  symbol: string;
  price: number;
  currency: string;
  asOf: string;
}

/** Mirrors stock.dto.StockInfo — note `ticker`/`currencySymbol`, not `symbol`/`currency`. */
export interface StockInfo {
  ticker: string;
  name: string;
  market: string;
  type: string;
  active: boolean;
  primaryExchange: string | null;
  currencySymbol: string;
  locale: string;
}

export interface TickerPage {
  results: StockInfo[];
  count: number;
  nextUrl: string | null;
}
