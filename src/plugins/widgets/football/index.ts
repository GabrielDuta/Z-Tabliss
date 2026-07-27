import { defineMessages } from "react-intl";

import { Config } from "../../types";
import Football from "./Football";
import FootballSettings from "./FootballSettings";
import { defaultData } from "./types";

const messages = defineMessages({
  name: {
    id: "plugins.football.name",
    defaultMessage: "Football Scores",
    description: "Name of the Football Scores widget",
  },
  description: {
    id: "plugins.football.description",
    defaultMessage:
      "Today's matches from Premier League, Serie A, La Liga, Bundesliga, UCL and more.",
    description: "Description of the Football Scores widget",
  },
});

const config: Config = {
  key: "widget/football",
  name: messages.name,
  description: messages.description,
  defaultData,
  dashboardComponent: Football,
  settingsComponent: FootballSettings,
};

export default config;
