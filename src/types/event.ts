export type EventCategory = "general" | "dday" | "exam" | "meeting";

export type EventVisibility = "month" | "week" | "day";

export type EventCheckStatus = "o" | "triangle" | "x";

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
  color: string | null; // 사용자가 고른 파스텔 hex color
  visibility: EventVisibility; // month | week | day (하위 단계에는 항상 노출됨)
  check_status: EventCheckStatus | null; // o(완료) | triangle(부분/보류) | x(미완료) | null(미체크)
  display_as_bar: boolean; // true면 하루짜리 일정도 월간 캘린더에 여행처럼 바 형태로 표시하고, 일일 플래너에서 완료 체크 UI를 숨김
  created_at: string;
}
