"use client";

import { useEffect, useState } from "react";
import { addDays, format, isToday, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  fetchEventsForRange,
  isBarEvent,
  reorderEvents,
  rescheduleEvent,
  setEventCheckStatus,
} from "@/lib/events";
import { toDateKey, ENGLISH_WEEKDAY } from "@/lib/date";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelIconButton } from "@/components/ui/PixelIconButton";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelModal } from "@/components/ui/PixelModal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TodayEventList } from "@/components/calendar/TodayEventList";
import { AddEventModal } from "@/components/calendar/AddEventModal";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import { MiniDatePicker } from "@/components/calendar/MiniDatePicker";
import { TodoList } from "@/components/todo/TodoList";
import { TodayRoutineList } from "@/components/routine/TodayRoutineList";
import { DiaryBox } from "@/components/routine/DiaryBox";
import type { EventCheckStatus, PlannerEvent } from "@/types/event";

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

  function handleSetCheckStatus(event: PlannerEvent, status: EventCheckStatus | null) {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, check_status: status } : e)));
    const supabase = createClient();
    setEventCheckStatus(supabase, event.id, status);
  }

  async function handleReschedule(event: PlannerEvent, newDateKey: string) {
    handleSetCheckStatus(event, "x");
    const supabase = createClient();
    const { event: created } = await rescheduleEvent(supabase, event, newDateKey);
    if (created && newDateKey === dateKey) {
      setEvents((prev) => [...prev, created]);
    }
  }

  function handleReorder(orderedEvents: PlannerEvent[]) {
    setEvents(orderedEvents);
    const supabase = createClient();
    reorderEvents(supabase, orderedEvents.map((e) => e.id));
  }

  // 바(여행 등) 일정은 O/X 버튼이 없어서 완료 여부를 매길 수 없으니 진행률 계산에서 뺌
  const checkableEvents = events.filter((e) => !isBarEvent(e));
  const doneEventCount = checkableEvents.filter((e) => e.check_status === "o").length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-cute text-3xl font-bold">오늘의 플래너</h1>
        <p className="font-body text-sm text-pixel-ink-soft">🐾 하루를 이쁘게 채워봐요</p>
      </div>

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
        <PixelCard tape="purple">
          <TodayRoutineList userId={userId} dateKey={dateKey} />
        </PixelCard>
        <PixelCard tape="pink">
          <h3 className="font-cute text-xl mb-2">📝 오늘의 TODO</h3>
          <TodoList userId={userId} scope="day" periodKey={dateKey} showProgress />
        </PixelCard>
      </div>

      <PixelCard tape="yellow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-cute text-xl">📌 오늘의 일정</h3>
          <PixelButton type="button" className="text-sm px-3 py-1.5" onClick={() => setAdding(true)}>
            + 추가
          </PixelButton>
        </div>
        {checkableEvents.length > 0 && (
          <ProgressBar done={doneEventCount} total={checkableEvents.length} className="mb-3" />
        )}
        <TodayEventList
          dateKey={dateKey}
          events={events}
          onSelect={setSelectedEvent}
          onSetCheckStatus={handleSetCheckStatus}
          onReschedule={handleReschedule}
          onReorder={handleReorder}
        />
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

      <PixelCard tape="mint">
        <DiaryBox userId={userId} dateKey={dateKey} />
      </PixelCard>
    </div>
  );
}
