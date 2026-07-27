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
});

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
}

function TimeSinceRow({ entry, now, opts, agoLabel, fromNowLabel }: RowProps) {
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
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

const TimeSince: FC<Props> = ({ data = defaultData }) => {
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
        />
      ))}
    </div>
  );
};

export default TimeSince;
