import { defineMessages } from "react-intl";

import { Config } from "../../types";
import TimeSince from "./TimeSince";
import TimeSinceSettings from "./TimeSinceSettings";
import { defaultData } from "./types";

const messages = defineMessages({
  name: {
    id: "plugins.timeSince.name",
    defaultMessage: "Time Since",
    description: "Name of the Time Since (multi-entry) widget",
  },
  description: {
    id: "plugins.timeSince.description",
    defaultMessage: "Track how much time has passed since multiple dates.",
    description: "Description of the Time Since (multi-entry) widget",
  },
});

const config: Config = {
  key: "widget/timeSince",
  name: messages.name,
  description: messages.description,
  dashboardComponent: TimeSince,
  settingsComponent: TimeSinceSettings,
  defaultData,
};

export default config;
