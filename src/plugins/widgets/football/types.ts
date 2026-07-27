import { API } from "../../types";

// ─── Persisted user settings ────────────────────────────────────────────────

export type Data = {
  /** Team names the user has starred; shown first when they play. */
  favouriteTeams: string[];
  /** Whether to show the league name badge on each game card. */
  showLeagueBadge: boolean;
  /** Whether to show kick-off time on upcoming games. */
  showTime: boolean;
  /** Whether the widget is collapsed (game list hidden). */
  collapsed: boolean;
};

export const defaultData: Data = {
  favouriteTeams: [],
  showLeagueBadge: true,
  showTime: true,
  collapsed: false,
};

// ─── API response shapes ─────────────────────────────────────────────────────

export type FootballTeam = {
  id: number;
  name: string;
  logo: string;
};

export type FootballScore = {
  home: number | null;
  away: number | null;
};

export type FootballStatus = {
  /** Short status code, e.g. "NS", "1H", "HT", "2H", "FT", "AET", "PEN" */
  short: string;
  /** Human-readable elapsed time (minutes) or null */
  elapsed: number | null;
};

export type FootballGame = {
  fixtureId: number;
  date: string; // ISO string
  status: FootballStatus;
  leagueName: string;
  leagueLogo: string;
  leagueId: number;
  home: FootballTeam;
  away: FootballTeam;
  score: FootballScore;
  isFavourite?: boolean;
};

// ─── Cache ───────────────────────────────────────────────────────────────────

export type Cache = {
  games: FootballGame[];
  timestamp: number;
};

export type Props = API<Data, Cache>;
