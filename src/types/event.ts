export type EventCategory = "general" | "dday" | "exam" | "meeting";

export interface PlannerEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  event_time: string | null; // HH:MM:SS
  description: string | null;
  category: EventCategory;
  created_at: string;
}
