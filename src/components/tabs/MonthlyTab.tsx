"use client";

import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { DayPopup } from "@/components/calendar/DayPopup";
import { GithubContributionsCard } from "@/components/github/GithubContributionsCard";
import { PixelCard } from "@/components/ui/PixelCard";
import { TodoList } from "@/components/todo/TodoList";
import { monthKey } from "@/lib/period";
import type { PlannerEvent } from "@/types/event";

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
  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
      <MonthCalendar
        monthDate={monthDate}
        onMonthChange={onMonthChange}
        events={events}
        onSelectDate={onSelectDate}
      />

      <PixelCard>
        <h2 className="font-cute text-2xl mb-2">📝 이달의 TODO</h2>
        <TodoList userId={userId} scope="month" periodKey={monthKey(monthDate)} />
      </PixelCard>

      {/* 캘린더+TODO 전체 너비만큼 꽉 채워서 아래에 배치 */}
      <div className="lg:col-span-2 min-w-0">
        <GithubContributionsCard userId={userId} onConnectClick={onGoToAccount} />
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
