"use client";

import { useEffect, useState } from "react";
import { addDays, format, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { fetchEventsForRange } from "@/lib/events";
import { toDateKey, KOREAN_WEEKDAY } from "@/lib/date";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelIconButton } from "@/components/ui/PixelIconButton";
import { EventList } from "@/components/calendar/EventList";
import { TodoList } from "@/components/todo/TodoList";
import { RoutineChecklist } from "@/components/routine/RoutineChecklist";
import { DiaryBox } from "@/components/routine/DiaryBox";
import type { PlannerEvent } from "@/types/event";

interface DailyPlannerTabProps {
  userId: string;
}

export function DailyPlannerTab({ userId }: DailyPlannerTabProps) {
  const [date, setDate] = useState(() => new Date());
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const dateKey = toDateKey(date);

  useEffect(() => {
    const supabase = createClient();
    fetchEventsForRange(supabase, dateKey, dateKey).then(setEvents);
  }, [dateKey]);

  return (
    <div className="flex flex-col gap-4">
      <PixelCard className="flex items-center justify-between">
        <PixelIconButton onClick={() => setDate((d) => subDays(d, 1))}>{"<"}</PixelIconButton>
        <div className="text-center">
          <h2 className="font-cute text-2xl">
            {format(date, "yyyy년 M월 d일")} {KOREAN_WEEKDAY[date.getDay()]}요일
          </h2>
          <button
            onClick={() => setDate(new Date())}
            className="font-body text-xs text-pixel-ink-soft underline cursor-pointer mt-1"
          >
            오늘로
          </button>
        </div>
        <PixelIconButton onClick={() => setDate((d) => addDays(d, 1))}>{">"}</PixelIconButton>
      </PixelCard>

      <div className="grid md:grid-cols-2 gap-4">
        <PixelCard>
          <RoutineChecklist userId={userId} period="morning" dateKey={dateKey} label="오전 루틴" emoji="🌅" />
        </PixelCard>
        <PixelCard>
          <RoutineChecklist userId={userId} period="afternoon" dateKey={dateKey} label="오후 루틴" emoji="🌤️" />
        </PixelCard>
        <PixelCard>
          <RoutineChecklist userId={userId} period="evening" dateKey={dateKey} label="퇴근 후 루틴" emoji="🌙" />
        </PixelCard>
        <PixelCard>
          <h3 className="font-cute text-xl mb-2">📝 오늘의 TODO</h3>
          <TodoList userId={userId} scope="day" periodKey={dateKey} />
        </PixelCard>
      </div>

      <PixelCard>
        <h3 className="font-cute text-xl mb-2">📌 오늘의 일정</h3>
        <EventList events={events} />
      </PixelCard>

      <PixelCard>
        <DiaryBox userId={userId} dateKey={dateKey} />
      </PixelCard>
    </div>
  );
}
