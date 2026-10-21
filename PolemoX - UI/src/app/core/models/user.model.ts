export interface UserView {
  id: number;
  username: string;
  email: string;
  displayName: string;
  xpTotal: number;
  level: number;
}

export interface UserSummary {
  id: number;
  username: string;
  displayName: string;
  xpTotal: number;
  level: number;
}
