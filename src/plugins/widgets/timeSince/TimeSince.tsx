import "./TimeSince.sass";

import { FC } from "react";
import { defineMessages, useIntl } from "react-intl";

import { useTime } from "../../../hooks";
import { defaultData, Props, TimeSinceEntry } from "./types";

// ─── i18n ────────────────────────────────────────────────────────────────────

const messages = defineMessages({
  addHint: {
    id: "plugins.timeSince.addHint",
    defaultMessage: "Add entries in settings",
    description: "Hint shown when no entries are configured",
  },
  year: {
    id: "plugins.timeSince.year",
    defaultMessage: "year",
    description: "Singular year",
  },
  years: {
    id: "plugins.timeSince.years",
    defaultMessage: "years",
    description: "Plural years",
  },
  month: {
    id: "plugins.timeSince.month",
    defaultMessage: "month",
    description: "Singular month",
  },
  months: {
    id: "plugins.timeSince.months",
    defaultMessage: "months",
    description: "Plural months",
  },
  day: {
    id: "plugins.timeSince.day",
    defaultMessage: "day",
    description: "Singular day",
  },
  days: {
    id: "plugins.timeSince.days",
    defaultMessage: "days",
    description: "Plural days",
  },
  ago: {
    id: "plugins.timeSince.ago",
    defaultMessage: "ago",
    description: "Suffix for past durations",
  },
  fromNow: {
    id: "plugins.timeSince.fromNow",
    defaultMessage: "from now",
    description: "Suffix for future durations",
  },
  changeDate: {
    id: "plugins.timeSince.changeDate",
    defaultMessage: "Change date",
    description: "Tooltip for calendar icon to change entry date",
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function CalendarIcon() {
  return (
    <svg
      className="timesince-row__calendar-svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ─── Duration formatting ──────────────────────────────────────────────────────

interface FormatOptions {
  yearLabel: string;
  yearsLabel: string;
  monthLabel: string;
  monthsLabel: string;
  dayLabel: string;
  daysLabel: string;
}

/** Truncate a timestamp to local midnight so time-of-day is ignored. */
function toMidnight(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatDuration(
  fromMs: number,
  toMs: number,
  opts: FormatOptions,
): string {
  // Compare whole calendar days only — strip hours / minutes / seconds.
  const from = new Date(toMidnight(fromMs));
  const to = new Date(toMidnight(toMs));

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  // Borrow from months if days went negative
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // Borrow from years if months went negative
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];

  if (years > 0)
    parts.push(`${years} ${years === 1 ? opts.yearLabel : opts.yearsLabel}`);
  if (months > 0)
    parts.push(
      `${months} ${months === 1 ? opts.monthLabel : opts.monthsLabel}`,
    );
  if (days > 0 || parts.length === 0)
    parts.push(`${days} ${days === 1 ? opts.dayLabel : opts.daysLabel}`);

  return parts.join(" ");
}

// ─── Row component ────────────────────────────────────────────────────────────

interface RowProps {
  entry: TimeSinceEntry;
  now: number;
  opts: FormatOptions;
  agoLabel: string;
  fromNowLabel: string;
  changeDateLabel: string;
  onUpdateDate?: (id: string, newDate: number) => void;
}

function TimeSinceRow({
  entry,
  now,
  opts,
  agoLabel,
  fromNowLabel,
  changeDateLabel,
  onUpdateDate,
}: RowProps) {
  const duration = formatDuration(entry.date, now, opts);
  const isFuture = toMidnight(entry.date) > toMidnight(now);
  const suffix = isFuture ? fromNowLabel : agoLabel;

  return (
    <div className="timesince-row">
      <span className="timesince-row__name">{entry.name}</span>
      {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
      <span className="timesince-row__sep">:</span>
      <span
        className={`timesince-row__duration${isFuture ? " timesince-row__duration--future" : ""}`}
      >
        {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
        {`${duration} ${suffix}`}
      </span>
      {onUpdateDate && (
        <span className="timesince-row__picker-wrapper" title={changeDateLabel}>
          <button
            type="button"
            className="timesince-row__calendar-btn"
            aria-label={changeDateLabel}
          >
            <CalendarIcon />
          </button>
          <input
            type="date"
            className="timesince-row__date-input"
            value={toDateValue(entry.date)}
            onChange={(e) => {
              if (e.target.value) {
                onUpdateDate(entry.id, fromDateValue(e.target.value));
              }
            }}
          />
        </span>
      )}
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

const TimeSince: FC<Props> = ({ data = defaultData, setData }) => {
  const intl = useIntl();
  const now = useTime().getTime();

  const opts: FormatOptions = {
    yearLabel: intl.formatMessage(messages.year),
    yearsLabel: intl.formatMessage(messages.years),
    monthLabel: intl.formatMessage(messages.month),
    monthsLabel: intl.formatMessage(messages.months),
    dayLabel: intl.formatMessage(messages.day),
    daysLabel: intl.formatMessage(messages.days),
  };

  function updateEntryDate(id: string, newDate: number) {
    if (!setData) return;
    setData({
      ...data,
      entries: data.entries.map((e) =>
        e.id === id ? { ...e, date: newDate } : e,
      ),
    });
  }

  if (data.entries.length === 0) {
    return (
      <div className="TimeSince TimeSince--empty">
        <span className="timesince-empty-hint">
          {intl.formatMessage(messages.addHint)}
        </span>
      </div>
    );
  }

  return (
    <div className="TimeSince">
      {data.entries.map((entry) => (
        <TimeSinceRow
          key={entry.id}
          entry={entry}
          now={now}
          opts={opts}
          agoLabel={intl.formatMessage(messages.ago)}
          fromNowLabel={intl.formatMessage(messages.fromNow)}
          changeDateLabel={intl.formatMessage(messages.changeDate)}
          onUpdateDate={
            typeof setData === "function" ? updateEntryDate : undefined
          }
        />
      ))}
    </div>
  );
};

export default TimeSince;
