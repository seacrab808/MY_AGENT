"use client";

import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { DayPopup } from "@/components/calendar/DayPopup";
import { GithubContributionsCard } from "@/components/github/GithubContributionsCard";
import { PixelCard } from "@/components/ui/PixelCard";
import { TodoList } from "@/components/todo/TodoList";
import { MonthlyRetrospective } from "@/components/routine/MonthlyRetrospective";
import { CATEGORY_COLOR_HEX, categoryLabel } from "@/lib/events";
import { monthKey } from "@/lib/period";
import type { EventCategory, PlannerEvent } from "@/types/event";

interface MonthlyTabProps {
  userId: string;
  monthDate: Date;
  onMonthChange: (date: Date) => void;
  events: PlannerEvent[];
  eventsByDate: Record<string, PlannerEvent[]>;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string | null) => void;
  onEventCreated: (event: PlannerEvent) => void;
  onEventUpdated: (event: PlannerEvent) => void;
  onEventDeleted: (eventId: string) => void;
  onEventDuplicated: (event: PlannerEvent) => void;
  onGoToAccount: () => void;
}

const LEGEND_CATEGORIES = Object.keys(CATEGORY_COLOR_HEX) as EventCategory[];

export function MonthlyTab({
  userId,
  monthDate,
  onMonthChange,
  events,
  eventsByDate,
  selectedDateKey,
  onSelectDate,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
  onEventDuplicated,
  onGoToAccount,
}: MonthlyTabProps) {
  const monthPeriodKey = monthKey(monthDate);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-cute text-3xl font-bold">월간 캘린더</h1>
        <p className="font-body text-sm text-pixel-ink-soft">🗓️ {monthKey(monthDate)}의 소중한 날들</p>
      </div>

      <MonthCalendar
        monthDate={monthDate}
        onMonthChange={onMonthChange}
        events={events}
        onSelectDate={onSelectDate}
      />

      {/* 일정 색상 안내 */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 px-2">
        <span className="font-body text-xs text-pixel-ink-soft">일정 색상 안내:</span>
        {LEGEND_CATEGORIES.map((category) => (
          <span key={category} className="flex items-center gap-1.5 font-body text-xs text-pixel-ink-soft">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: CATEGORY_COLOR_HEX[category] }}
            />
            {categoryLabel(category)}
          </span>
        ))}
      </div>

      <GithubContributionsCard userId={userId} onConnectClick={onGoToAccount} />

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <PixelCard tape="pink">
          <h2 className="font-cute text-2xl mb-2">📝 이달의 TODO</h2>
          <TodoList userId={userId} scope="month" periodKey={monthPeriodKey} showProgress />
        </PixelCard>

        <PixelCard tape="mint">
          <MonthlyRetrospective userId={userId} periodKey={monthPeriodKey} />
        </PixelCard>
      </div>

      <DayPopup
        dateKey={selectedDateKey}
        events={selectedDateKey ? eventsByDate[selectedDateKey] ?? [] : []}
        onClose={() => onSelectDate(null)}
        userId={userId}
        onEventCreated={onEventCreated}
        onEventUpdated={onEventUpdated}
        onEventDeleted={onEventDeleted}
        onEventDuplicated={onEventDuplicated}
      />
    </div>
  );
}
