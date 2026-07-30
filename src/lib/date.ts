import { addDays, format, isMonday, startOfWeek, endOfWeek } from "date-fns";

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayIsMonday(date: Date = new Date()): boolean {
  return isMonday(date);
}

export function currentWeekRange(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start: toDateKey(start), end: toDateKey(end) };
}

export function weekDays(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const KOREAN_WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
export const ENGLISH_WEEKDAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const ENGLISH_WEEKDAY_FULL = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
