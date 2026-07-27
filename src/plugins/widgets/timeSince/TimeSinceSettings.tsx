import "./TimeSinceSettings.sass";

import { FC } from "react";
import { defineMessages, useIntl } from "react-intl";

import { defaultData, Props, TimeSinceEntry } from "./types";

// ─── i18n messages ────────────────────────────────────────────────────────────

const messages = defineMessages({
  namePlaceholder: {
    id: "plugins.timeSince.settings.namePlaceholder",
    defaultMessage: "Name",
    description: "Placeholder for the entry name input",
  },
  removeEntry: {
    id: "plugins.timeSince.settings.removeEntry",
    defaultMessage: "Remove entry",
    description: "Tooltip / aria-label for the remove-entry button",
  },
  addEntry: {
    id: "plugins.timeSince.settings.addEntry",
    defaultMessage: "+ Add entry",
    description: "Label for the add-entry button",
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function toDateValue(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromDateValue(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

// ─── Settings component ───────────────────────────────────────────────────────

const TimeSinceSettings: FC<Props> = ({ data = defaultData, setData }) => {
  const intl = useIntl();
  const entries = data.entries;

  function addEntry() {
    const newEntry: TimeSinceEntry = {
      id: generateId(),
      name: "",
      date: Date.now(),
    };
    setData({ ...data, entries: [...entries, newEntry] });
  }

  function updateEntry(id: string, patch: Partial<Omit<TimeSinceEntry, "id">>) {
    setData({
      ...data,
      entries: entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }

  function removeEntry(id: string) {
    setData({ ...data, entries: entries.filter((e) => e.id !== id) });
  }

  return (
    <div className="TimeSinceSettings">
      <div className="TimeSinceSettings__list">
        {entries.map((entry) => (
          <div key={entry.id} className="TimeSinceSettings__entry">
            <input
              type="text"
              className="TimeSinceSettings__name-input"
              value={entry.name}
              placeholder={intl.formatMessage(messages.namePlaceholder)}
              onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
            />
            <input
              type="date"
              className="TimeSinceSettings__date-input"
              value={toDateValue(entry.date)}
              onChange={(e) => {
                if (e.target.value) {
                  updateEntry(entry.id, {
                    date: fromDateValue(e.target.value),
                  });
                }
              }}
            />
            <button
              className="TimeSinceSettings__remove-btn"
              aria-label={intl.formatMessage(messages.removeEntry)}
              title={intl.formatMessage(messages.removeEntry)}
              onClick={() => removeEntry(entry.id)}
            >
              {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
              {"\u2715"}
            </button>
          </div>
        ))}
      </div>

      <button
        className="TimeSinceSettings__add-btn"
        onClick={addEntry}
        aria-label={intl.formatMessage(messages.addEntry)}
      >
        {intl.formatMessage(messages.addEntry)}
      </button>
    </div>
  );
};

export default TimeSinceSettings;
