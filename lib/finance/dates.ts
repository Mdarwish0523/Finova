export type PeriodType = "daily" | "weekly" | "monthly";

export type DateRange = {
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
};

export function dateInTimeZone(date = new Date(), timeZone = "America/New_York") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function startOfWeek(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  const day = value.getUTCDay();
  return shiftDate(date, -(day === 0 ? 6 : day - 1));
}

export function startOfMonth(date: string) {
  return `${date.slice(0, 7)}-01`;
}

export function endOfMonth(date: string) {
  const value = new Date(`${startOfMonth(date)}T12:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + 1);
  value.setUTCDate(0);
  return value.toISOString().slice(0, 10);
}

export function daysBetween(start: string, end: string) {
  return Math.floor(
    (Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) /
      86_400_000,
  ) + 1;
}

export function rangeForPeriod(
  period: PeriodType,
  anchor: string,
): DateRange {
  let start = anchor;
  let end = anchor;
  if (period === "weekly") {
    start = startOfWeek(anchor);
    end = shiftDate(start, 6);
  }
  if (period === "monthly") {
    start = startOfMonth(anchor);
    end = endOfMonth(anchor);
  }
  const length = daysBetween(start, end);
  const previousEnd = shiftDate(start, -1);
  return {
    start,
    end,
    previousStart: shiftDate(previousEnd, -(length - 1)),
    previousEnd,
  };
}

export function customRange(start: string, end: string): DateRange {
  const length = daysBetween(start, end);
  const previousEnd = shiftDate(start, -1);
  return {
    start,
    end,
    previousStart: shiftDate(previousEnd, -(length - 1)),
    previousEnd,
  };
}

export function completedPeriodRange(period: PeriodType, today: string) {
  if (period === "daily") return rangeForPeriod(period, shiftDate(today, -1));
  if (period === "weekly") return rangeForPeriod(period, shiftDate(startOfWeek(today), -1));
  return rangeForPeriod(period, shiftDate(startOfMonth(today), -1));
}

export function enumerateDates(start: string, end: string) {
  const dates: string[] = [];
  for (let current = start; current <= end; current = shiftDate(current, 1)) {
    dates.push(current);
  }
  return dates;
}
