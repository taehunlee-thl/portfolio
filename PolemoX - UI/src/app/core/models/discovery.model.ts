import { SessionInterval, SessionStatus } from './session.model';
import { UserSummary } from './user.model';

export interface TrendingSymbolView {
  symbol: string;
  companyName: string | null;
  logoUrl: string | null;
  price: number;
  /** Move across the sparkline window — not an official day change. */
  changePct: number;
  sparkline: number[];
  /** True when the series is generated rather than real history; the chart says so when set. */
  synthetic: boolean;
}

export interface MarketPulseView {
  symbols: TrendingSymbolView[];
  asOf: string;
  /** Upstream provider failed for at least one symbol — some tiles are missing. */
  degraded: boolean;
}

export interface LiveParticipantView {
  rank: number;
  username: string;
  displayName: string;
  level: number;
  equity: number;
  pnlAmount: number;
  pnlPct: number;
}

export interface LiveSessionView {
  id: number;
  name: string;
  creatorUsername: string;
  status: SessionStatus;
  interval: SessionInterval;
  requestedStartAt: string;
  startedAt: string | null;
  endAt: string | null;
  participantCount: number;
  maxParticipants: number;
  startingBalance: number;
  /** Venue being traded; constant "US Equities" today. */
  market: string;
  /** Tickers currently held in this battle, with logos — the card's symbol tags. */
  symbols: CompanyProfileSummary[];
  participants: LiveParticipantView[];
}

/** Ticker decoration: company name, logo and sector. Null fields mean the provider had no record. */
export interface CompanyProfileSummary {
  symbol: string;
  companyName: string | null;
  logoUrl: string | null;
  industry: string | null;
}

export type TradeSide = 'BUY' | 'SELL';

/** One fill on a battle's live tape. */
export interface SessionTradeView {
  id: number;
  username: string;
  displayName: string;
  symbol: string;
  companyName: string | null;
  logoUrl: string | null;
  side: TradeSide;
  quantity: number;
  price: number;
  totalAmount: number;
  executedAt: string;
}

/** A symbol ranked by how much PolemoX's own traders are trading it. */
export interface TrendingSymbolActivityView {
  symbol: string;
  companyName: string | null;
  logoUrl: string | null;
  industry: string | null;
  trades: number;
  buys: number;
  sells: number;
  volume: number;
  /** Share of fills that were buys, 0-100; above 50 is net accumulation. */
  buyPressurePct: number;
  /** Null when the market-data provider was unreachable. */
  price: number | null;
}

export interface TrendingSectorView {
  sector: string;
  trades: number;
  volume: number;
  buyPressurePct: number;
  topSymbols: string[];
}

export interface TraderSymbolView {
  symbol: string;
  companyName: string | null;
  logoUrl: string | null;
  industry: string | null;
  trades: number;
  volume: number;
}

export interface TraderProfileView {
  user: UserSummary;
  battlesPlayed: number;
  wins: number;
  winRatePct: number;
  bestYieldPct: number;
  avgYieldPct: number;
  tradesExecuted: number;
  buys: number;
  sells: number;
  buyPressurePct: number;
  favouriteSymbols: TraderSymbolView[];
  favouriteSector: string | null;
}

/** One trader's line on a battle chart; `points` is parallel to the battle's shared `timeline`. */
export interface EquitySeriesView {
  userId: number;
  username: string;
  displayName: string;
  points: number[];
}

export interface FeaturedBattleView {
  session: LiveSessionView;
  /** Shared x-axis for every series. Empty when the battle is too new to have history yet. */
  timeline: string[];
  series: EquitySeriesView[];
}

export type RankingCategory = 'XP' | 'BEST_PNL' | 'AVG_PNL' | 'WINS' | 'WIN_RATE';

export const RANKING_CATEGORIES: { id: RankingCategory; label: string; blurb: string }[] = [
  { id: 'XP', label: 'Experience', blurb: 'Lifetime XP earned from finishing battles' },
  { id: 'BEST_PNL', label: 'Best P&L', blurb: 'Single best finishing yield' },
  { id: 'AVG_PNL', label: 'Consistency', blurb: 'Mean finishing yield across all battles' },
  { id: 'WINS', label: 'Wins', blurb: 'First-place finishes' },
  { id: 'WIN_RATE', label: 'Win rate', blurb: 'Share of battles won' },
];

export interface RankingEntryView {
  rank: number;
  user: UserSummary;
  /** Value for the selected category — what the rank was assigned from. */
  score: number;
  xpTotal: number;
  level: number;
  battlesPlayed: number;
  wins: number;
  bestYieldPct: number;
  avgYieldPct: number;
  winRatePct: number;
}

export interface RankingBoardView {
  category: RankingCategory;
  entries: RankingEntryView[];
  minBattlesForRateCategories: number;
  asOf: string;
}

export interface PlatformStatsView {
  traders: number;
  liveBattles: number;
  completedBattles: number;
  tradesExecuted: number;
}
