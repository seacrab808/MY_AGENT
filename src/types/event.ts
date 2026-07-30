export type EventCategory = "general" | "travel" | "important" | "meeting" | "conference";

export type EventVisibility = "month" | "week" | "day";

export type EventCheckStatus = "o" | "x";

export interface PlannerEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string; // YYYY-MM-DD (시작일)
  event_end_date: string | null; // YYYY-MM-DD (연속 일정의 마지막 날). 단일 날짜면 null
  event_time: string | null; // HH:MM:SS
  end_time: string | null; // HH:MM:SS
  description: string | null;
  category: EventCategory;
  color: string | null; // 더 이상 폼에서 직접 고르지 않음(레거시 컬럼). 색상은 category로 고정 표시(eventColor() 참고)
  visibility: EventVisibility; // month | week | day (하위 단계에는 항상 노출됨)
  check_status: EventCheckStatus | null; // o(완료) | x(미룸/못함) | null(미체크)
  display_as_bar: boolean; // true면 하루짜리 일정도 월간 캘린더에 여행처럼 바 형태로 표시하고, 일일 플래너에서 완료 체크 UI를 숨김
  sort_order: number | null; // 일일 플래너 "오늘의 일정" 드래그 순서 (그룹 내 상대 순서, null이면 created_at으로 대체)
  created_at: string;
}
