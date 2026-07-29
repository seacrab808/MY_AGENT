export type RoutinePeriod = "morning" | "afternoon" | "evening";

export interface RoutineItem {
  id: string;
  user_id: string;
  period: RoutinePeriod;
  label: string;
  routine_date: string;
  is_done: boolean;
  created_at: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}
