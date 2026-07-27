import "./Football.sass";

import type { FC } from "react";
import { useEffect } from "react";
import { defineMessages, FormattedMessage, useIntl } from "react-intl";

import { fetchFootballGames } from "./api";
import { defaultData, FootballGame, Props } from "./types";

const messages = defineMessages({
  widgetTitle: {
    id: "plugins.football.widgetTitle",
    defaultMessage: "Football",
    description: "Football widget title",
  },
  loadingGames: {
    id: "plugins.football.loadingGames",
    defaultMessage: "Loading games…",
    description: "Football widget loading state",
  },
  noGamesToday: {
    id: "plugins.football.noGamesToday",
    defaultMessage: "No games today",
    description: "Football widget no games state",
  },
  openSofaScore: {
    id: "plugins.football.openSofaScore",
    defaultMessage: "Open SofaScore",
    description: "Tooltip to open SofaScore website",
  },
  showGames: {
    id: "plugins.football.showGames",
    defaultMessage: "Show games",
    description: "Tooltip to expand football widget",
  },
  hideGames: {
    id: "plugins.football.hideGames",
    defaultMessage: "Hide games",
    description: "Tooltip to collapse football widget",
  },
  expandWidget: {
    id: "plugins.football.expandWidget",
    defaultMessage: "Expand football widget",
    description: "Aria label to expand football widget",
  },
  collapseWidget: {
    id: "plugins.football.collapseWidget",
    defaultMessage: "Collapse football widget",
    description: "Aria label to collapse football widget",
  },
  fullTime: {
    id: "plugins.football.fullTime",
    defaultMessage: "FT",
    description: "Full time abbreviation",
  },
  halfTime: {
    id: "plugins.football.halfTime",
    defaultMessage: "HT",
    description: "Half time abbreviation",
  },
  versus: {
    id: "plugins.football.versus",
    defaultMessage: "vs",
    description: "Versus abbreviation",
  },
});

// ─── SofaScore link ───────────────────────────────────────────────────────────

function openSofaScore() {
  window.open("https://www.sofascore.com", "_blank", "noopener,noreferrer");
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function isLive(status: string): boolean {
  return ["1H", "2H", "ET", "P", "BT", "HT"].includes(status);
}

function isFinished(status: string): boolean {
  return ["FT", "AET", "PEN", "AWD", "WO"].includes(status);
}

function formatKickoff(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: FootballGame["status"] }) {
  const { short, elapsed } = status;
  if (isLive(short)) {
    return (
      <span className="football-status football-status--live">
        <span className="football-status-dot" />
        {short === "HT" ? (
          <FormattedMessage {...messages.halfTime} />
        ) : (
          /* eslint-disable-next-line formatjs/no-literal-string-in-jsx */
          `${elapsed ?? ""}′`
        )}
      </span>
    );
  }
  if (isFinished(short)) {
    return (
      <span className="football-status football-status--finished">
        <FormattedMessage {...messages.fullTime} />
      </span>
    );
  }
  return null;
}

// ─── Game card ────────────────────────────────────────────────────────────────

interface GameCardProps {
  game: FootballGame;
  showLeagueBadge: boolean;
  showTime: boolean;
}

function GameCard({ game, showLeagueBadge, showTime }: GameCardProps) {
  const intl = useIntl();
  const live = isLive(game.status.short);
  const finished = isFinished(game.status.short);
  const notStarted = game.status.short === "NS";

  const hasScore = (live || finished) && game.score.home !== null;

  return (
    <div
      className={`football-game football-game--clickable${game.isFavourite ? " football-game--favourite" : ""}${live ? " football-game--live" : ""}`}
      onClick={() => openSofaScore()}
      title={intl.formatMessage(messages.openSofaScore)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && openSofaScore()}
    >
      {showLeagueBadge && (
        <div className="football-league">
          <img
            className="football-league-logo"
            src={game.leagueLogo}
            alt={game.leagueName}
          />
          <span className="football-league-name">{game.leagueName}</span>
          <StatusBadge status={game.status} />
        </div>
      )}
      {!showLeagueBadge && (
        <div className="football-league football-league--compact">
          <StatusBadge status={game.status} />
        </div>
      )}

      <div className="football-matchup">
        {/* Home team */}
        <div className="football-team football-team--home">
          <img
            className="football-team-logo"
            src={game.home.logo}
            alt={game.home.name}
          />
          <span className="football-team-name">{game.home.name}</span>
        </div>

        {/* Score / time */}
        <div className="football-score-block">
          {hasScore ? (
            <span className="football-score">
              {String(game.score.home)}
              {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
              <span className="football-score-sep">–</span>
              {String(game.score.away)}
            </span>
          ) : notStarted && showTime ? (
            <span className="football-kickoff">
              {String(formatKickoff(game.date))}
            </span>
          ) : (
            <span className="football-score-sep">
              <FormattedMessage {...messages.versus} />
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="football-team football-team--away">
          <img
            className="football-team-logo"
            src={game.away.logo}
            alt={game.away.name}
          />
          <span className="football-team-name">{game.away.name}</span>
        </div>
      </div>

      {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
      {game.isFavourite && <span className="football-fav-star">★</span>}
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

const Football: FC<Props> = ({
  cache,
  data = defaultData,
  setCache,
  setData,
  loader,
}) => {
  const intl = useIntl();

  useEffect(() => {
    fetchFootballGames(loader, data.favouriteTeams).then(setCache);
  }, [data.favouriteTeams, loader, setCache]);

  const gameCount = cache?.games.length ?? 0;

  function toggleCollapsed() {
    setData({ ...data, collapsed: !data.collapsed });
  }

  // ── Header bar (always visible) ──────────────────────────────────────────
  const header = (
    <div
      className="football-header"
      onClick={toggleCollapsed}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && toggleCollapsed()}
      title={
        data.collapsed
          ? intl.formatMessage(messages.showGames)
          : intl.formatMessage(messages.hideGames)
      }
      aria-label={
        data.collapsed
          ? intl.formatMessage(messages.expandWidget)
          : intl.formatMessage(messages.collapseWidget)
      }
    >
      <span className="football-header-title">
        { }⚽{" "}
        {data.collapsed && gameCount > 0 ? (
          <span className="football-header-count">
            <FormattedMessage
              id="plugins.football.gamesTodayCount"
              defaultMessage="{count, plural, one {# game} other {# games}} today"
              description="Header game count summary when collapsed"
              values={{ count: gameCount }}
            />
          </span>
        ) : (
          <FormattedMessage {...messages.widgetTitle} />
        )}
      </span>
      { }
      <span className="football-toggle-btn" aria-hidden="true">
        {data.collapsed ? "▸" : "▾"}
      </span>
    </div>
  );

  if (data.collapsed) {
    return (
      <div className="football-container football-container--collapsed">
        {header}
      </div>
    );
  }

  if (!cache) {
    return (
      <div className="football-container">
        {header}
        <div className="football-container--empty">
          {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
          <span className="football-empty-icon">⚽</span>
          <span>
            <FormattedMessage {...messages.loadingGames} />
          </span>
        </div>
      </div>
    );
  }

  if (cache.games.length === 0) {
    return (
      <div className="football-container">
        {header}
        <div className="football-container--empty">
          {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
          <span className="football-empty-icon">⚽</span>
          <span>
            <FormattedMessage {...messages.noGamesToday} />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="football-container">
      {header}
      <div className="football-games-list">
        {cache.games.map((game) => (
          <GameCard
            key={game.fixtureId}
            game={game}
            showLeagueBadge={data.showLeagueBadge}
            showTime={data.showTime}
          />
        ))}
      </div>
    </div>
  );
};

export default Football;
