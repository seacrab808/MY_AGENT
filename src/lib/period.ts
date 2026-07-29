import { getISOWeek, getISOWeekYear, getQuarter } from "date-fns";

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function weekKey(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

export function quarterKey(date: Date): string {
  return `${date.getFullYear()}-Q${getQuarter(date)}`;
}

export function yearKey(date: Date): string {
  return `${date.getFullYear()}`;
}
