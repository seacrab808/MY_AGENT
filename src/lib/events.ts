import { SupabaseClient } from "@supabase/supabase-js";
import { eachDayOfInterval, parseISO } from "date-fns";
import { toDateKey } from "@/lib/date";
import type { EventCategory, EventVisibility, PlannerEvent } from "@/types/event";

export async function fetchEventsForRange(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
): Promise<PlannerEvent[]> {
  // event_date~event_end_date 구간이 [startDate, endDate]와 겹치는 일정을 모두 가져온다.
  // (단일 날짜 일정은 event_end_date가 null이라 event_date만으로 판단)
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .lte("event_date", endDate)
    .or(`event_end_date.gte.${startDate},and(event_end_date.is.null,event_date.gte.${startDate})`)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data as PlannerEvent[];
}

// 여러 날에 걸친 일정이거나, 하루짜리여도 display_as_bar가 켜져 있으면 월간 캘린더에 바 형태로 표시
export function isBarEvent(
  event: Pick<PlannerEvent, "event_date" | "event_end_date" | "display_as_bar">,
): boolean {
  const isRange = Boolean(event.event_end_date) && event.event_end_date !== event.event_date;
  return isRange || Boolean(event.display_as_bar);
}

export function eventDateKeys(event: PlannerEvent): string[] {
  if (!event.event_end_date || event.event_end_date === event.event_date) {
    return [event.event_date];
  }
  return eachDayOfInterval({
    start: parseISO(event.event_date),
    end: parseISO(event.event_end_date),
  }).map(toDateKey);
}

// 일일 플래너 "오늘의 일정" 정렬: 미체크가 맨 위, O가 그 아래, X가 맨 아래. 같은 그룹 안에서는
// sort_order(드래그로 정한 순서) 우선, 없으면 등록 시각(created_at) 순서로 대체
function checkStatusRank(status: PlannerEvent["check_status"]): number {
  if (status === "o") return 1;
  if (status === "x") return 2;
  return 0;
}

export function sortDailyEvents(events: PlannerEvent[]): PlannerEvent[] {
  return [...events].sort((a, b) => {
    const rankDiff = checkStatusRank(a.check_status) - checkStatusRank(b.check_status);
    if (rankDiff !== 0) return rankDiff;
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return a.created_at.localeCompare(b.created_at);
  });
}

export function groupEventsByDate(events: PlannerEvent[]): Record<string, PlannerEvent[]> {
  return events.reduce<Record<string, PlannerEvent[]>>((acc, event) => {
    for (const dateKey of eventDateKeys(event)) {
      (acc[dateKey] ??= []).push(event);
    }
    return acc;
  }, {});
}

// visibility 단계는 하위(더 촘촘한) 뷰에는 항상 노출된다: month -> week, day / week -> day
const TAB_VISIBLE_TIERS: Record<"month" | "week" | "day", EventVisibility[]> = {
  month: ["month"],
  week: ["month", "week"],
  day: ["month", "week", "day"],
};

export function filterEventsForTab(
  events: PlannerEvent[],
  tab: "month" | "week" | "day",
): PlannerEvent[] {
  const allowed = TAB_VISIBLE_TIERS[tab];
  return events.filter((event) => allowed.includes(event.visibility));
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

export const CATEGORY_COLOR_HEX: Record<EventCategory, string> = {
  general: "#8fb4ff",
  dday: "#ff8a8a",
  exam: "#d2b8ff",
  meeting: "#a8ebc9",
};

export function eventColor(event: Pick<PlannerEvent, "color" | "category">): string {
  return event.color || CATEGORY_COLOR_HEX[event.category];
}

export const PASTEL_COLOR_PRESETS: { name: string; value: string }[] = [
  { name: "블루", value: "#8fb4ff" },
  { name: "핑크", value: "#ffb8d1" },
  { name: "옐로우", value: "#ffdb85" },
  { name: "민트", value: "#a8ebc9" },
  { name: "퍼플", value: "#d2b8ff" },
  { name: "레드", value: "#ff8a8a" },
  { name: "피치", value: "#ffd0b3" },
  { name: "라벤더", value: "#c9c6ff" },
];

// 종료 시간 미입력 시 기본 duration: 미팅/세미나류는 2시간, 그 외는 1시간
export function defaultDurationHours(category: EventCategory): number {
  return category === "meeting" ? 2 : 1;
}

// "HH:MM" 또는 "HH:MM:SS" 문자열에 시간을 더해 "HH:MM:SS"로 반환 (자정 넘어가면 랩어라운드)
export function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = (((h * 60 + m + hours * 60) % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const mm = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:00`;
}

export function computeEndTime(
  eventTime: string | null | undefined,
  category: EventCategory,
  explicitEndTime?: string | null,
): string | null {
  if (!eventTime) return null;
  if (explicitEndTime) return explicitEndTime.length === 5 ? `${explicitEndTime}:00` : explicitEndTime;
  return addHoursToTime(eventTime, defaultDurationHours(category));
}

// 채팅으로 파싱된 일정의 노출 단계 계산: 여러 날에 걸치거나 시간이 없으면 월간부터, 특정 시간이 있으면 주간부터
export function computeVisibility(input: {
  event_date: string;
  event_end_date?: string | null;
  event_time?: string | null;
}): EventVisibility {
  const isRange = Boolean(input.event_end_date) && input.event_end_date !== input.event_date;
  const hasTime = Boolean(input.event_time);
  return isRange || !hasTime ? "month" : "week";
}

export interface CreateEventInput {
  user_id: string;
  title: string;
  event_date: string;
  event_end_date?: string | null;
  event_time?: string | null;
  end_time?: string | null;
  description?: string | null;
  category?: EventCategory;
  color?: string | null;
  visibility: EventVisibility;
  display_as_bar?: boolean;
}

export async function createEvent(
  supabase: SupabaseClient,
  input: CreateEventInput,
): Promise<{ event: PlannerEvent | null; error: string | null }> {
  const category = input.category ?? "general";
  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: input.user_id,
      title: input.title,
      event_date: input.event_date,
      event_end_date: input.event_end_date || null,
      event_time: input.event_time || null,
      end_time: computeEndTime(input.event_time, category, input.end_time),
      description: input.description || null,
      category,
      color: input.color || null,
      visibility: input.visibility,
      display_as_bar: input.display_as_bar ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return { event: null, error: "일정 저장에 실패했어요." };
  }

  return { event: data as PlannerEvent, error: null };
}

export type UpdateEventInput = Partial<
  Pick<
    PlannerEvent,
    | "title"
    | "event_date"
    | "event_end_date"
    | "event_time"
    | "end_time"
    | "description"
    | "category"
    | "color"
    | "visibility"
    | "check_status"
    | "display_as_bar"
    | "sort_order"
  >
>;

export async function updateEvent(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateEventInput,
): Promise<{ event: PlannerEvent | null; error: string | null }> {
  const { data, error } = await supabase.from("events").update(patch).eq("id", id).select().single();

  if (error) {
    console.error(error);
    return { event: null, error: "일정 수정에 실패했어요." };
  }

  return { event: data as PlannerEvent, error: null };
}

export async function setEventCheckStatus(
  supabase: SupabaseClient,
  id: string,
  checkStatus: PlannerEvent["check_status"],
): Promise<{ event: PlannerEvent | null; error: string | null }> {
  return updateEvent(supabase, id, { check_status: checkStatus });
}

// 드래그로 정한 새 순서를 그룹 내 상대 순서(sort_order)로 저장. orderedIds는 화면에 보이는 순서 그대로.
export async function reorderEvents(supabase: SupabaseClient, orderedIds: string[]): Promise<string | null> {
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("events").update({ sort_order: index }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error(failed.error);
    return "순서 저장에 실패했어요.";
  }
  return null;
}

// X 체크(미루기): 오늘 일정은 그대로 두고(호출부에서 check_status를 'x'로 표시), 고른 날짜에 새 일정을 등록
export async function rescheduleEvent(
  supabase: SupabaseClient,
  event: PlannerEvent,
  newDate: string,
): Promise<{ event: PlannerEvent | null; error: string | null }> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: event.user_id,
      title: event.title,
      event_date: newDate,
      event_end_date: null,
      event_time: event.event_time,
      end_time: event.end_time,
      description: event.description,
      category: event.category,
      color: event.color,
      visibility: event.visibility,
      display_as_bar: false,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return { event: null, error: "일정 미루기에 실패했어요." };
  }

  return { event: data as PlannerEvent, error: null };
}

export async function deleteEvent(supabase: SupabaseClient, id: string): Promise<string | null> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    console.error(error);
    return "일정 삭제에 실패했어요.";
  }
  return null;
}

export async function duplicateEvent(
  supabase: SupabaseClient,
  event: PlannerEvent,
): Promise<{ event: PlannerEvent | null; error: string | null }> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: event.user_id,
      title: event.title,
      event_date: event.event_date,
      event_end_date: event.event_end_date,
      event_time: event.event_time,
      end_time: event.end_time,
      description: event.description,
      category: event.category,
      color: event.color,
      visibility: event.visibility,
      display_as_bar: event.display_as_bar,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return { event: null, error: "일정 복제에 실패했어요." };
  }

  return { event: data as PlannerEvent, error: null };
}
