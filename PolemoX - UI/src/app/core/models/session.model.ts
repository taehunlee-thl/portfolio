import { UserSummary } from './user.model';

export type SessionInterval = 'ONE_HOUR' | 'ONE_DAY' | 'THREE_DAY' | 'SEVEN_DAY' | 'THIRTY_DAY';

export type SessionStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

/** PUBLIC battles are listed on the open board; PRIVATE ones need an invite or the join code. */
export type SessionVisibility = 'PUBLIC' | 'PRIVATE';

export const SESSION_INTERVAL_LABEL: Record<SessionInterval, string> = {
  ONE_HOUR: '1 hour',
  ONE_DAY: '1 day',
  THREE_DAY: '3 days',
  SEVEN_DAY: '7 days',
  THIRTY_DAY: '30 days',
};

export interface SessionView {
  id: number;
  name: string;
  creatorUsername: string;
  status: SessionStatus;
  interval: SessionInterval;
  visibility: SessionVisibility;
  requestedStartAt: string;
  startedAt: string | null;
  endAt: string | null;
  maxParticipants: number;
  participantCount: number;
  startingBalance: number;
}

export interface ParticipantView {
  user: UserSummary;
  accountId: number;
  joinedAt: string;
  finalYieldPct: number | null;
  finalRank: number | null;
  xpAwarded: number | null;
}

export interface SessionDetailView {
  id: number;
  name: string;
  creatorUsername: string;
  status: SessionStatus;
  interval: SessionInterval;
  visibility: SessionVisibility;
  requestedStartAt: string;
  startedAt: string | null;
  endAt: string | null;
  maxParticipants: number;
  startingBalance: number;
  joinCode: string;
  participants: ParticipantView[];
}

export interface InviteView {
  id: number;
  sessionId: number;
  sessionName: string;
  sessionInterval: SessionInterval;
  invitedByUsername: string;
  status: InviteStatus;
  createdAt: string;
}

export interface LeaderboardEntryView {
  rank: number;
  user: UserSummary;
  cashBalance: number;
  equity: number;
  yieldPct: number;
}

export interface LeaderboardView {
  sessionId: number;
  status: SessionStatus;
  entries: LeaderboardEntryView[];
  asOf: string;
}

export interface CreateSessionRequest {
  name: string;
  interval: SessionInterval;
  visibility: SessionVisibility;
  maxParticipants: number | null;
  startingBalance: number | null;
  startAt: string | null;
}
