import { API } from "../../types";
import { FootballGame } from "./types";

// ─── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_API_KEY = "ae836f9f0f8853a2e10ee3c16b15c767";
const API_KEY =
  typeof FOOTBALL_API_KEY !== "undefined" && FOOTBALL_API_KEY
    ? FOOTBALL_API_KEY
    : DEFAULT_API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

/**
 * Priority league IDs (in display-priority order):
 *   39  → Premier League
 *   135 → Serie A
 *   140 → La Liga
 *   78  → Bundesliga
 *   2   → UEFA Champions League
 *   40  → EFL Championship
 */
const PRIORITY_LEAGUE_IDS = [39, 135, 140, 78, 2, 40];

// ─── Raw API Types ────────────────────────────────────────────────────────────

interface RawApiFixtureResponse {
  response?: RawFixtureItem[];
}

interface RawFixtureItem {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * European leagues (PL, Serie A, La Liga, Bundesliga, UCL) run August → May.
 * The API registers them under the year the season *started*, so:
 *   Jan–June  → previous year  (e.g. in April 2026 the active season is 2025)
 *   July–Dec  → current year   (e.g. in August 2026 the new 2026/27 season starts)
 */
function currentFootballSeason(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: 0=Jan … 6=Jul
  return month < 7 ? now.getFullYear() - 1 : now.getFullYear();
}

async function apiFetch(path: string): Promise<RawApiFixtureResponse> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": API_KEY,
    },
  });
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    const errorMsg =
      typeof data.errors === "object"
        ? JSON.stringify(data.errors)
        : String(data.errors);
    throw new Error(`API-Football error payload: ${errorMsg}`);
  }
  return data;
}

function mapFixture(fixture: RawFixtureItem): FootballGame {
  return {
    fixtureId: fixture.fixture.id,
    date: fixture.fixture.date,
    status: {
      short: fixture.fixture.status.short,
      elapsed: fixture.fixture.status.elapsed ?? null,
    },
    leagueName: fixture.league.name,
    leagueLogo: fixture.league.logo,
    leagueId: fixture.league.id,
    home: {
      id: fixture.teams.home.id,
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
    },
    away: {
      id: fixture.teams.away.id,
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
    },
    score: {
      home: fixture.goals.home,
      away: fixture.goals.away,
    },
  };
}

// ─── Main fetch ──────────────────────────────────────────────────────────────

export async function fetchFootballGames(
  loader: API["loader"],
  favouriteTeams: string[],
): Promise<{ games: FootballGame[]; timestamp: number }> {
  loader.push();

  try {
    const date = todayDateString();
    let games: FootballGame[] = [];

    // Attempt parallel fetch for priority leagues first
    const season = currentFootballSeason();
    const results = await Promise.allSettled(
      PRIORITY_LEAGUE_IDS.map((leagueId) =>
        apiFetch(`/fixtures?date=${date}&league=${leagueId}&season=${season}`),
      ),
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value?.response) {
        games.push(...result.value.response.map(mapFixture));
      }
    }

    // Fallback: if priority-league query returns no games (e.g. offseason or plan restrictions on league/season),
    // fetch all fixtures for today
    if (games.length === 0) {
      try {
        const fallback = await apiFetch(`/fixtures?date=${date}`);
        if (fallback?.response) {
          games = fallback.response.map(mapFixture);
        }
      } catch (err) {
        console.warn("Football API fallback fetch failed:", err);
      }
    }

    const leaguePriority = (id: number): number => {
      const idx = PRIORITY_LEAGUE_IDS.indexOf(id);
      return idx !== -1 ? idx : 999;
    };

    const statusOrder = (s: string): number => {
      if (["1H", "2H", "ET", "P", "BT", "HT"].includes(s)) return 0; // live
      if (s === "NS") return 1; // not started
      return 2; // finished / other
    };

    games.sort((a, b) => {
      const aFav = isFavourite(a, favouriteTeams) ? 0 : 1;
      const bFav = isFavourite(b, favouriteTeams) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;

      const aPrio = leaguePriority(a.leagueId);
      const bPrio = leaguePriority(b.leagueId);
      if (aPrio !== bPrio) return aPrio - bPrio;

      return statusOrder(a.status.short) - statusOrder(b.status.short);
    });

    if (games.length > 25) {
      games = games.slice(0, 25);
    }

    // Tag favourites
    games = games.map((g) => ({
      ...g,
      isFavourite: isFavourite(g, favouriteTeams),
    }));

    return { games, timestamp: Date.now() };
  } finally {
    loader.pop();
  }
}

function isFavourite(game: FootballGame, favouriteTeams: string[]): boolean {
  if (!favouriteTeams.length) return false;
  const favLower = favouriteTeams.map((t) => t.toLowerCase().trim());
  return (
    favLower.includes(game.home.name.toLowerCase()) ||
    favLower.includes(game.away.name.toLowerCase())
  );
}
