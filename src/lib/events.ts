import { SupabaseClient } from "@supabase/supabase-js";
import type { PlannerEvent } from "@/types/event";

export async function fetchEventsForRange(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
): Promise<PlannerEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", startDate)
    .lte("event_date", endDate)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data as PlannerEvent[];
}

export function groupEventsByDate(events: PlannerEvent[]): Record<string, PlannerEvent[]> {
  return events.reduce<Record<string, PlannerEvent[]>>((acc, event) => {
    (acc[event.event_date] ??= []).push(event);
    return acc;
  }, {});
}

const CATEGORY_LABEL: Record<PlannerEvent["category"], string> = {
  general: "일정",
  dday: "디데이",
  exam: "시험",
  meeting: "미팅",
};

export function categoryLabel(category: PlannerEvent["category"]): string {
  return CATEGORY_LABEL[category] ?? "일정";
}
