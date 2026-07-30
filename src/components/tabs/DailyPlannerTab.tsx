"use client";

import { useEffect, useState } from "react";
import { addDays, format, isToday, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { fetchEventsForRange } from "@/lib/events";
import { toDateKey, ENGLISH_WEEKDAY } from "@/lib/date";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelIconButton } from "@/components/ui/PixelIconButton";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelModal } from "@/components/ui/PixelModal";
import { EventList } from "@/components/calendar/EventList";
import { AddEventModal } from "@/components/calendar/AddEventModal";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import { MiniDatePicker } from "@/components/calendar/MiniDatePicker";
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
  const [adding, setAdding] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  const dateKey = toDateKey(date);

  useEffect(() => {
    const supabase = createClient();
    fetchEventsForRange(supabase, dateKey, dateKey).then(setEvents);
  }, [dateKey]);

  return (
    <div className="flex flex-col gap-4">
      <PixelCard className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <PixelIconButton onClick={() => setDate((d) => subDays(d, 1))} className="shrink-0">
          {"<"}
        </PixelIconButton>
        <div className="text-center min-w-0">
          <button
            type="button"
            onClick={() => setPickingDate(true)}
            className="font-cute text-lg sm:text-2xl break-words cursor-pointer hover:underline"
          >
            {format(date, "yyyy년 M월 d일")} {ENGLISH_WEEKDAY[date.getDay()]}
          </button>
          {!isToday(date) && (
            <button
              onClick={() => setDate(new Date())}
              className="block mx-auto font-body text-xs text-pixel-ink-soft underline cursor-pointer mt-1"
            >
              오늘로
            </button>
          )}
        </div>
        <PixelIconButton onClick={() => setDate((d) => addDays(d, 1))} className="shrink-0">
          {">"}
        </PixelIconButton>
      </PixelCard>

      <PixelModal open={pickingDate} onClose={() => setPickingDate(false)} title="날짜 선택" emoji="📅">
        <MiniDatePicker
          value={date}
          onSelect={(d) => {
            setDate(d);
            setPickingDate(false);
          }}
        />
      </PixelModal>

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
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-cute text-xl">📌 오늘의 일정</h3>
          <PixelButton type="button" className="text-sm px-3 py-1.5" onClick={() => setAdding(true)}>
            + 추가
          </PixelButton>
        </div>
        <EventList events={events} onSelect={setSelectedEvent} />
      </PixelCard>

      <AddEventModal
        open={adding}
        onClose={() => setAdding(false)}
        userId={userId}
        dateKey={dateKey}
        visibility="day"
        onCreated={(event) => setEvents((prev) => [...prev, event])}
      />

      {selectedEvent && (
        <EventDetailModal
          key={selectedEvent.id}
          event={selectedEvent}
          userId={userId}
          onClose={() => setSelectedEvent(null)}
          onUpdated={(updated) => {
            setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
            setSelectedEvent(updated);
          }}
          onDeleted={(id) => {
            setEvents((prev) => prev.filter((e) => e.id !== id));
            setSelectedEvent(null);
          }}
          onDuplicated={(copy) => setEvents((prev) => [...prev, copy])}
        />
      )}

      <PixelCard>
        <DiaryBox userId={userId} dateKey={dateKey} />
      </PixelCard>
    </div>
  );
}
