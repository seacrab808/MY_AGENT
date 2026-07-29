"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { toDateKey } from "@/lib/date";
import type { PlannerEvent } from "@/types/event";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelIconButton } from "@/components/ui/PixelIconButton";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const CATEGORY_DOT: Record<PlannerEvent["category"], string> = {
  general: "bg-pixel-blue",
  dday: "bg-pixel-red",
  exam: "bg-pixel-purple",
  meeting: "bg-pixel-mint",
};

interface MonthCalendarProps {
  monthDate: Date;
  onMonthChange: (date: Date) => void;
  eventsByDate: Record<string, PlannerEvent[]>;
  onSelectDate: (dateKey: string) => void;
}

export function MonthCalendar({
  monthDate,
  onMonthChange,
  eventsByDate,
  onSelectDate,
}: MonthCalendarProps) {
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <PixelCard>
      <div className="flex items-center justify-between mb-3">
        <PixelIconButton onClick={() => onMonthChange(subMonths(monthDate, 1))} aria-label="이전 달">
          {"<"}
        </PixelIconButton>
        <h2 className="font-cute text-2xl">{format(monthDate, "yyyy년 M월")}</h2>
        <PixelIconButton onClick={() => onMonthChange(addMonths(monthDate, 1))} aria-label="다음 달">
          {">"}
        </PixelIconButton>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="font-cute text-center text-sm text-pixel-ink-soft">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const dayEvents = eventsByDate[dateKey] ?? [];
          const inMonth = isSameMonth(day, monthDate);
          const todayFlag = isToday(day);

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={`aspect-square flex flex-col items-center justify-start p-1 rounded-[8px] border-2 cursor-pointer transition-transform ${
                todayFlag
                  ? "border-pixel-border bg-gradient-to-b from-[#ffedb0] to-pixel-yellow shadow-[var(--pixel-bevel)]"
                  : "border-transparent hover:border-pixel-border hover:-translate-y-0.5"
              } ${!inMonth ? "opacity-35" : ""}`}
            >
              <span className="font-cute text-base leading-none mt-1">{format(day, "d")}</span>
              <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                {dayEvents.slice(0, 3).map((event) => (
                  <span
                    key={event.id}
                    className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[event.category]}`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </PixelCard>
  );
}
