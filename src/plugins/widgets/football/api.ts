import { API } from "../../types";
import { FootballGame } from "./types";

// ─── Configuration ───────────────────────────────────────────────────────────

const API_KEY = "ae836f9f0f8853a2e10ee3c16b15c767";
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

async function apiFetch(path: string): Promise<RawApiFixtureResponse> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": API_KEY,
    },
  });
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);
  return res.json();
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

    // Fetch all priority leagues in parallel
    const results = await Promise.allSettled(
      PRIORITY_LEAGUE_IDS.map((leagueId) =>
        apiFetch(
          `/fixtures?date=${date}&league=${leagueId}&season=${new Date().getFullYear()}`,
        ),
      ),
    );

    let games: FootballGame[] = [];

    for (const result of results) {
      if (result.status === "fulfilled" && result.value?.response) {
        games.push(...result.value.response.map(mapFixture));
      }
    }

    // Fallback: if no priority-league games today, fetch any top fixtures today
    if (games.length === 0) {
      try {
        const fallback = await apiFetch(`/fixtures?date=${date}`);
        if (fallback?.response) {
          // Take up to 20 games across all leagues, sorted by status (live first)
          games = fallback.response.slice(0, 20).map(mapFixture);
        }
      } catch {
        // If fallback also fails, return empty
      }
    }

    // Sort: live games first, then upcoming, then finished
    const statusOrder = (s: string): number => {
      if (["1H", "2H", "ET", "P", "BT", "HT"].includes(s)) return 0; // live
      if (s === "NS") return 1; // not started
      return 2; // finished / other
    };

    games.sort((a, b) => {
      const aFav = isFavourite(a, favouriteTeams) ? 0 : 1;
      const bFav = isFavourite(b, favouriteTeams) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return statusOrder(a.status.short) - statusOrder(b.status.short);
    });

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
