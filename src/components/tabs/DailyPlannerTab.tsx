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
import { expandCourseOccurrences, fetchCoursesWithSessions } from "@/lib/courses";
import { toDateKey, ENGLISH_WEEKDAY_FULL } from "@/lib/date";
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
import { CourseDetailModal } from "@/components/timetable/CourseDetailModal";
import type { EventCheckStatus, PlannerEvent } from "@/types/event";
import type { CourseWithSessions } from "@/types/course";

interface DailyPlannerTabProps {
  userId: string;
}

export function DailyPlannerTab({ userId }: DailyPlannerTabProps) {
  const [date, setDate] = useState(() => new Date());
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [courses, setCourses] = useState<CourseWithSessions[]>([]);
  const [adding, setAdding] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithSessions | null>(null);
  const dateKey = toDateKey(date);
  const todayCourseOccurrences = expandCourseOccurrences(courses, dateKey, dateKey);

  useEffect(() => {
    const supabase = createClient();
    fetchEventsForRange(supabase, dateKey, dateKey).then(setEvents);
  }, [dateKey]);

  useEffect(() => {
    const supabase = createClient();
    fetchCoursesWithSessions(supabase, userId).then(setCourses);
  }, [userId]);

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
    // orderedEvents는 화면에 보이는 새 순서 그대로지만, 각 이벤트 객체 자체의 sort_order 값은 아직
    // 예전 값 그대로임. TodayEventList가 매번 sortDailyEvents(events)로 다시 정렬하기 때문에, 배열
    // "순서"만 바꾸고 sort_order를 안 갱신하면 재정렬 시 옛 sort_order 기준으로 다시 섞여서 드래그
    // 결과가 즉시 원위치로 튕겨 보임(드래그가 "안 되는" 것처럼 보이던 원인). 여기서 인덱스를 그대로
    // sort_order로 박아 넣어야 재정렬 결과가 방금 놓은 순서와 일치함.
    const withSortOrder = orderedEvents.map((e, i) => ({ ...e, sort_order: i }));
    setEvents(withSortOrder);
    const supabase = createClient();
    reorderEvents(supabase, withSortOrder.map((e) => e.id));
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

      {/* 이 grid 레이아웃은 반드시 bodyClassName으로 줘야 함 — PixelCard의 className은 바깥 프레임과
          안쪽 body div에 둘 다 적용되는데(다른 곳의 h-full/flex 트릭 때문에 의도된 동작), 여기서
          className으로 grid를 주면 바깥쪽도 3열 grid가 되면서 안쪽 body div 하나가 그 grid의 첫
          칸(auto)에만 들어가 버려서 내용이 왼쪽으로 쏠리고 중앙 1fr 칸은 빈 채로 남아 정렬이 깨짐 */}
      <PixelCard bodyClassName="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <PixelIconButton onClick={() => setDate((d) => subDays(d, 1))} className="shrink-0">
          {"<"}
        </PixelIconButton>
        <div className="text-center min-w-0">
          <button
            type="button"
            onClick={() => setPickingDate(true)}
            className="font-cute text-lg sm:text-2xl break-words cursor-pointer hover:underline"
          >
            {format(date, "yyyy년 M월 d일")} {ENGLISH_WEEKDAY_FULL[date.getDay()]}
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

      {todayCourseOccurrences.length > 0 && (
        <PixelCard tape="blue">
          <h3 className="font-cute text-xl mb-2">🎓 오늘의 수업</h3>
          <div className="flex flex-col gap-1.5">
            {todayCourseOccurrences.map((occ) => (
              <button
                key={occ.session.id}
                type="button"
                onClick={() => setSelectedCourse(occ.course)}
                className="flex items-center gap-2 w-full text-left font-body text-sm px-2.5 py-1.5 border-2 border-pixel-border rounded-[8px] cursor-pointer hover:-translate-y-0.5 transition-transform"
                style={{ backgroundColor: occ.course.color, color: "var(--pixel-chip-ink)" }}
              >
                <span className="font-bold">
                  {occ.session.start_time.slice(0, 5)}~{occ.session.end_time.slice(0, 5)}
                </span>
                <span>
                  {occ.course.kind === "ta" ? "🧑‍🏫" : "🎓"} {occ.course.title}
                </span>
                {occ.course.professor && <span className="text-xs opacity-80">{occ.course.professor} 교수님</span>}
              </button>
            ))}
          </div>
        </PixelCard>
      )}

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

      {selectedCourse && (
        <CourseDetailModal
          key={selectedCourse.id}
          course={selectedCourse}
          userId={userId}
          onClose={() => setSelectedCourse(null)}
          onUpdated={(updated) => {
            setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setSelectedCourse(updated);
          }}
          onDeleted={(id) => {
            setCourses((prev) => prev.filter((c) => c.id !== id));
            setSelectedCourse(null);
          }}
        />
      )}

      <PixelCard tape="mint">
        <DiaryBox userId={userId} dateKey={dateKey} />
      </PixelCard>
    </div>
  );
}
