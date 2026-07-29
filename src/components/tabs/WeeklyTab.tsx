"use client";

import { useEffect, useState } from "react";
import { addWeeks, format, subWeeks } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { fetchEventsForRange, groupEventsByDate } from "@/lib/events";
import { toDateKey, weekDays, KOREAN_WEEKDAY } from "@/lib/date";
import { weekKey } from "@/lib/period";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelBadge } from "@/components/ui/PixelBadge";
import { PixelIconButton } from "@/components/ui/PixelIconButton";
import { TodoList } from "@/components/todo/TodoList";
import { GoalList } from "@/components/goal/GoalList";
import type { PlannerEvent } from "@/types/event";

interface WeeklyTabProps {
  userId: string;
}

export function WeeklyTab({ userId }: WeeklyTabProps) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<PlannerEvent[]>([]);

  const days = weekDays(anchor);
  const eventsByDate = groupEventsByDate(events);

  useEffect(() => {
    const supabase = createClient();
    fetchEventsForRange(supabase, toDateKey(days[0]), toDateKey(days[6])).then(setEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  return (
    <div className="flex flex-col gap-4">
      <PixelCard>
        <div className="flex items-center justify-between mb-3">
          <PixelIconButton onClick={() => setAnchor((d) => subWeeks(d, 1))}>{"<"}</PixelIconButton>
          <h2 className="font-cute text-2xl">
            {format(days[0], "M/d")} ~ {format(days[6], "M/d")}
          </h2>
          <PixelIconButton onClick={() => setAnchor((d) => addWeeks(d, 1))}>{">"}</PixelIconButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {days.map((day) => {
            const dateKey = toDateKey(day);
            const dayEvents = eventsByDate[dateKey] ?? [];
            return (
              <div
                key={dateKey}
                className="border-2 border-pixel-border rounded-[10px] p-2 bg-pixel-bg min-h-24"
              >
                <p className="font-cute text-sm mb-1">
                  {format(day, "M/d")} {KOREAN_WEEKDAY[day.getDay()]}
                </p>
                <div className="flex flex-col gap-1">
                  {dayEvents.length === 0 && (
                    <span className="font-body text-xs text-pixel-ink-soft">-</span>
                  )}
                  {dayEvents.map((event) => (
                    <PixelBadge key={event.id} tone="blue" className="block text-left w-fit">
                      {event.event_time ? `${event.event_time.slice(0, 5)} ` : ""}
                      {event.title}
                    </PixelBadge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </PixelCard>

      <div className="grid md:grid-cols-2 gap-4">
        <PixelCard>
          <h2 className="font-cute text-2xl mb-2">🎯 이번 주 목표</h2>
          <GoalList userId={userId} scope="week" periodKey={weekKey(anchor)} />
        </PixelCard>
        <PixelCard>
          <h2 className="font-cute text-2xl mb-2">📝 이번 주 TODO</h2>
          <TodoList userId={userId} scope="week" periodKey={weekKey(anchor)} />
        </PixelCard>
      </div>
    </div>
  );
}
