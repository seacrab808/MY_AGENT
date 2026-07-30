export type TabKey =
  | "monthly"
  | "chat"
  | "weekly"
  | "daily"
  | "routine_preset"
  | "goals"
  | "vocab"
  | "account";

export interface TabDef {
  key: TabKey;
  label: string;
  emoji: string;
}

export const TABS: TabDef[] = [
  { key: "monthly", label: "월간 캘린더", emoji: "📅" },
  { key: "weekly", label: "주간 캘린더", emoji: "🗓️" },
  { key: "daily", label: "일일 플래너", emoji: "📔" },
  { key: "routine_preset", label: "하루 루틴", emoji: "🔄" },
  { key: "goals", label: "분기 · 연도 목표", emoji: "🎯" },
  { key: "vocab", label: "단어 카드 퀴즈", emoji: "🃏" },
  { key: "chat", label: "채팅창", emoji: "💬" },
  { key: "account", label: "내 계정", emoji: "👤" },
];
