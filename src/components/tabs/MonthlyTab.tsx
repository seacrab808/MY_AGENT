"use client";

import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { DayPopup } from "@/components/calendar/DayPopup";
import { PixelCard } from "@/components/ui/PixelCard";
import { TodoList } from "@/components/todo/TodoList";
import { monthKey } from "@/lib/period";
import type { PlannerEvent } from "@/types/event";

interface MonthlyTabProps {
  userId: string;
  monthDate: Date;
  onMonthChange: (date: Date) => void;
  eventsByDate: Record<string, PlannerEvent[]>;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string | null) => void;
}

export function MonthlyTab({
  userId,
  monthDate,
  onMonthChange,
  eventsByDate,
  selectedDateKey,
  onSelectDate,
}: MonthlyTabProps) {
  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
      <MonthCalendar
        monthDate={monthDate}
        onMonthChange={onMonthChange}
        eventsByDate={eventsByDate}
        onSelectDate={onSelectDate}
      />

      <PixelCard>
        <h2 className="font-cute text-2xl mb-2">📝 이달의 TODO</h2>
        <TodoList userId={userId} scope="month" periodKey={monthKey(monthDate)} />
      </PixelCard>

      <DayPopup
        dateKey={selectedDateKey}
        events={selectedDateKey ? eventsByDate[selectedDateKey] ?? [] : []}
        onClose={() => onSelectDate(null)}
      />
    </div>
  );
}
