import type { DashboardTimezone, DateFilter } from "./types";

const timezoneLabels: Record<DashboardTimezone, string> = {
  "America/New_York": "New York",
  "America/Lima": "Lima",
};

function getTimeZoneParts(date: Date, timeZone: DashboardTimezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
}

function getOffsetMs(date: Date, timeZone: DashboardTimezone) {
  const parts = getTimeZoneParts(date, timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return localAsUtc - date.getTime();
}

function zonedDateTimeToUtc(
  timeZone: DashboardTimezone,
  year: number,
  month: number,
  day: number,
) {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const firstPass = new Date(guess.getTime() - getOffsetMs(guess, timeZone));
  const secondPass = new Date(
    guess.getTime() - getOffsetMs(firstPass, timeZone),
  );

  return secondPass;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function normalizeTimezone(value?: string): DashboardTimezone {
  return value === "America/Lima" ? "America/Lima" : "America/New_York";
}

export function normalizeDateFilter(value?: string): DateFilter {
  if (value === "yesterday" || value === "7d" || value === "all") {
    return value;
  }

  return "today";
}

export function normalizeSortDirection(value?: string) {
  return value === "asc" ? "asc" : "desc";
}

export function getTimezoneLabel(timeZone: DashboardTimezone) {
  return timezoneLabels[timeZone];
}

export function getDateRange(filter: DateFilter, timeZone: DashboardTimezone) {
  if (filter === "all") {
    return null;
  }

  const nowParts = getTimeZoneParts(new Date(), timeZone);
  const todayStart = zonedDateTimeToUtc(
    timeZone,
    nowParts.year,
    nowParts.month,
    nowParts.day,
  );

  if (filter === "today") {
    return {
      from: todayStart.toISOString(),
      to: addDays(todayStart, 1).toISOString(),
    };
  }

  if (filter === "yesterday") {
    return {
      from: addDays(todayStart, -1).toISOString(),
      to: todayStart.toISOString(),
    };
  }

  return {
    from: addDays(todayStart, -6).toISOString(),
    to: addDays(todayStart, 1).toISOString(),
  };
}

export function formatDateInTimezone(
  value: string,
  timeZone: DashboardTimezone,
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTimeInTimezone(
  value: string,
  timeZone: DashboardTimezone,
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
