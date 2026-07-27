import { FC, useRef, useState } from "react";
import { defineMessages, FormattedMessage, useIntl } from "react-intl";

import { defaultData, Props } from "./types";

const settingsMessages = defineMessages({
  placeholderTeam: {
    id: "plugins.football.placeholderTeam",
    defaultMessage: "e.g. Arsenal",
    description: "Placeholder for team input",
  },
  addTeamTitle: {
    id: "plugins.football.addTeamTitle",
    defaultMessage: "Add team",
    description: "Title for add team button",
  },
  removeTeamTitle: {
    id: "plugins.football.removeTeamTitle",
    defaultMessage: "Remove",
    description: "Title for remove team button",
  },
});

const FootballSettings: FC<Props> = ({ data = defaultData, setData }) => {
  const intl = useIntl();
  const [teamInput, setTeamInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTeam() {
    const trimmed = teamInput.trim();
    if (!trimmed) return;
    if (
      data.favouriteTeams
        .map((t) => t.toLowerCase())
        .includes(trimmed.toLowerCase())
    ) {
      setTeamInput("");
      return;
    }
    setData({ ...data, favouriteTeams: [...data.favouriteTeams, trimmed] });
    setTeamInput("");
    inputRef.current?.focus();
  }

  function removeTeam(team: string) {
    setData({
      ...data,
      favouriteTeams: data.favouriteTeams.filter((t) => t !== team),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addTeam();
  }

  return (
    <div className="FootballSettings">
      {/* Display options */}
      <label>
        <input
          type="checkbox"
          checked={data.showLeagueBadge}
          onChange={(e) =>
            setData({ ...data, showLeagueBadge: e.target.checked })
          }
        />
        <span style={{ marginLeft: "0.4em" }}>
          <FormattedMessage
            id="plugins.football.showLeagueBadge"
            defaultMessage="Show league badge"
            description="Football widget setting: show league badge"
          />
        </span>
      </label>

      <label>
        <input
          type="checkbox"
          checked={data.showTime}
          onChange={(e) => setData({ ...data, showTime: e.target.checked })}
        />
        <span style={{ marginLeft: "0.4em" }}>
          <FormattedMessage
            id="plugins.football.showTime"
            defaultMessage="Show kick-off time"
            description="Football widget setting: show kick-off time"
          />
        </span>
      </label>

      <hr />

      {/* Favourite teams */}
      <p style={{ margin: "0 0 0.5em", fontWeight: 600, fontSize: "0.9em" }}>
        <FormattedMessage
          id="plugins.football.favouriteTeams"
          defaultMessage="Favourite teams"
          description="Football widget favourite teams section heading"
        />
      </p>
      <p style={{ margin: "0 0 0.6em", opacity: 0.65, fontSize: "0.8em" }}>
        <FormattedMessage
          id="plugins.football.favouriteTeamsHint"
          defaultMessage="Their games will appear at the top, highlighted with a star."
          description="Football widget favourite teams hint"
        />
      </p>

      <div style={{ display: "flex", gap: "0.4em", marginBottom: "0.6em" }}>
        <input
          ref={inputRef}
          type="text"
          value={teamInput}
          placeholder={intl.formatMessage(settingsMessages.placeholderTeam)}
          onChange={(e) => setTeamInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1 }}
        />
        <button
          onClick={addTeam}
          disabled={!teamInput.trim()}
          title={intl.formatMessage(settingsMessages.addTeamTitle)}
        >
          <FormattedMessage
            id="plugins.football.addTeam"
            defaultMessage="Add"
            description="Football widget add team button"
          />
        </button>
      </div>

      {data.favouriteTeams.length === 0 ? (
        <p style={{ opacity: 0.45, fontSize: "0.8em", margin: 0 }}>
          <FormattedMessage
            id="plugins.football.noFavourites"
            defaultMessage="No favourite teams yet."
            description="Football widget no favourites message"
          />
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.35em",
          }}
        >
          {data.favouriteTeams.map((team) => (
            <li
              key={team}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,210,50,0.08)",
                border: "1px solid rgba(255,210,50,0.25)",
                borderRadius: "6px",
                padding: "0.3em 0.6em",
                fontSize: "0.85em",
              }}
            >
              <span>
                {"\u2B50\u00A0"}
                {team}
              </span>
              <button
                onClick={() => removeTeam(team)}
                title={intl.formatMessage(settingsMessages.removeTeamTitle)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  opacity: 0.5,
                  padding: "0 0.2em",
                  fontSize: "1em",
                  lineHeight: 1,
                }}
              >
                {"\u2715"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <hr />

      <p style={{ opacity: 0.4, fontSize: "0.72em", margin: 0 }}>
        <FormattedMessage
          id="plugins.football.attribution"
          defaultMessage="Data by {link}. Refreshes on new tab."
          description="Football widget data attribution footer"
          values={{
            link: (
              <a
                href="https://www.api-football.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                API-Football
              </a>
            ),
          }}
        />
      </p>
    </div>
  );
};

export default FootballSettings;
