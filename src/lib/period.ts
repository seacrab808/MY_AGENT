import { getISOWeek, getISOWeekYear } from "date-fns";

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function weekKey(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

export function yearKey(date: Date): string {
  return `${date.getFullYear()}`;
}

/**
 * "분기" here means school-year season, not a calendar quarter:
 * 봄학기(3-6월) / 여름방학(7-8월) / 가을학기(9-12월) / 겨울방학(1-2월).
 * 겨울방학 (Jan-Feb) belongs to the academic year of the preceding 가을학기,
 * so e.g. Jan/Feb 2027 is grouped with academicYear 2026 (2026-winter).
 */
export type QuarterSeason = "spring" | "summer" | "fall" | "winter";

const SEASON_ORDER: QuarterSeason[] = ["spring", "summer", "fall", "winter"];

const SEASON_LABELS: Record<QuarterSeason, string> = {
  spring: "봄학기",
  summer: "여름방학",
  fall: "가을학기",
  winter: "겨울방학",
};

const SEASON_START_MONTH: Record<QuarterSeason, number> = {
  spring: 3,
  summer: 7,
  fall: 9,
  winter: 1,
};

function getQuarterInfo(date: Date): { academicYear: number; season: QuarterSeason } {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month >= 3 && month <= 6) return { academicYear: year, season: "spring" };
  if (month >= 7 && month <= 8) return { academicYear: year, season: "summer" };
  if (month >= 9 && month <= 12) return { academicYear: year, season: "fall" };
  return { academicYear: year - 1, season: "winter" };
}

export function quarterKey(date: Date): string {
  const { academicYear, season } = getQuarterInfo(date);
  return `${academicYear}-${season}`;
}

export function quarterLabel(date: Date): string {
  const { academicYear, season } = getQuarterInfo(date);
  return `${academicYear} ${SEASON_LABELS[season]}`;
}

function quarterAnchorDate(academicYear: number, season: QuarterSeason): Date {
  const calendarYear = season === "winter" ? academicYear + 1 : academicYear;
  return new Date(calendarYear, SEASON_START_MONTH[season] - 1, 1);
}

/** Returns an anchor date for the season `delta` steps away (can be negative). */
export function shiftQuarter(date: Date, delta: number): Date {
  const { academicYear, season } = getQuarterInfo(date);
  let index = SEASON_ORDER.indexOf(season) + delta;
  let year = academicYear;
  while (index < 0) {
    index += 4;
    year -= 1;
  }
  while (index >= 4) {
    index -= 4;
    year += 1;
  }
  return quarterAnchorDate(year, SEASON_ORDER[index]);
}
