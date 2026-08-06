"use client";

import { useEffect, useState } from "react";
import { addWeeks, format, subWeeks } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { eventColor, fetchEventsForRange, groupEventsByDate } from "@/lib/events";
import { expandCourseOccurrences, fetchCoursesWithSessions } from "@/lib/courses";
import { toDateKey, weekDays, KOREAN_WEEKDAY } from "@/lib/date";
import { weekKey } from "@/lib/period";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelIconButton } from "@/components/ui/PixelIconButton";
import { TodoList } from "@/components/todo/TodoList";
import { GoalList } from "@/components/goal/GoalList";
import { AddEventModal } from "@/components/calendar/AddEventModal";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import { CourseDetailModal } from "@/components/timetable/CourseDetailModal";
import type { PlannerEvent } from "@/types/event";
import type { CourseWithSessions } from "@/types/course";

interface WeeklyTabProps {
  userId: string;
}

export function WeeklyTab({ userId }: WeeklyTabProps) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [courses, setCourses] = useState<CourseWithSessions[]>([]);
  const [addingDateKey, setAddingDateKey] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithSessions | null>(null);

  const days = weekDays(anchor);
  const eventsByDate = groupEventsByDate(events);
  const weekStartKey = toDateKey(days[0]);
  const weekEndKey = toDateKey(days[6]);
  const courseOccurrencesByDate = expandCourseOccurrences(courses, weekStartKey, weekEndKey).reduce<
    Record<string, ReturnType<typeof expandCourseOccurrences>>
  >((acc, occ) => {
    (acc[occ.dateKey] ??= []).push(occ);
    return acc;
  }, {});

  useEffect(() => {
    const supabase = createClient();
    fetchEventsForRange(supabase, weekStartKey, weekEndKey).then(setEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  useEffect(() => {
    const supabase = createClient();
    fetchCoursesWithSessions(supabase, userId).then(setCourses);
  }, [userId]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-cute text-3xl font-bold">주간 캘린더</h1>
        <p className="font-body text-sm text-pixel-ink-soft">🗓️ 이번 주를 한눈에 확인해요</p>
      </div>

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
                <div className="flex items-center justify-between mb-1">
                  <p className="font-cute text-sm">
                    {format(day, "M/d")} {KOREAN_WEEKDAY[day.getDay()]}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddingDateKey(dateKey)}
                    className="font-cute text-xs font-bold w-5 h-5 flex items-center justify-center shrink-0 border-2 border-pixel-border rounded-full bg-pixel-panel text-pixel-ink-soft cursor-pointer active:scale-95 transition-transform"
                    aria-label="일정 추가"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {dayEvents.length === 0 && (
                    <span className="font-body text-xs text-pixel-ink-soft">-</span>
                  )}
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="inline-block font-body text-sm leading-snug px-2 py-1 border-2 border-pixel-border rounded-[8px] w-fit text-left cursor-pointer hover:-translate-y-0.5 transition-transform"
                      style={{ backgroundColor: eventColor(event), color: "var(--pixel-chip-ink)" }}
                    >
                      {event.event_time ? `${event.event_time.slice(0, 5)} ` : ""}
                      {event.title}
                    </button>
                  ))}
                  {(courseOccurrencesByDate[dateKey] ?? []).map((occ) => (
                    <button
                      key={occ.session.id}
                      type="button"
                      onClick={() => setSelectedCourse(occ.course)}
                      className="inline-block font-body text-sm leading-snug px-2 py-1 border-2 border-pixel-border rounded-[8px] w-fit text-left cursor-pointer hover:-translate-y-0.5 transition-transform"
                      style={{ backgroundColor: occ.course.color, color: "var(--pixel-chip-ink)" }}
                    >
                      {occ.session.start_time.slice(0, 5)} {occ.course.kind === "ta" ? "🧑‍🏫" : "🎓"}{" "}
                      {occ.course.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </PixelCard>

      <AddEventModal
        open={addingDateKey !== null}
        onClose={() => setAddingDateKey(null)}
        userId={userId}
        dateKey={addingDateKey ?? toDateKey(days[0])}
        visibility="week"
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
