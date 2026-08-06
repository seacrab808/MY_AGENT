"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { COURSE_WEEKDAY_INDEXES, courseKindLabel, fetchCoursesWithSessions } from "@/lib/courses";
import { KOREAN_WEEKDAY } from "@/lib/date";
import type { CourseSession, CourseWithSessions } from "@/types/course";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { AddCourseModal } from "@/components/timetable/AddCourseModal";
import { CourseDetailModal } from "@/components/timetable/CourseDetailModal";

interface TimetableTabProps {
  userId: string;
}

const GRID_START_MIN = 9 * 60;
const GRID_END_MIN = 18 * 60;
const GRID_TOTAL_MIN = GRID_END_MIN - GRID_START_MIN;
const PX_PER_MIN = 1.2;
const GRID_HEIGHT = GRID_TOTAL_MIN * PX_PER_MIN;
const GUTTER_WIDTH = 44;

interface Tick {
  top: number;
  kind: "hour" | "half" | "quarter";
}

const TICKS: Tick[] = Array.from({ length: GRID_TOTAL_MIN / 15 + 1 }, (_, i) => {
  const m = i * 15;
  const kind: Tick["kind"] = m % 60 === 0 ? "hour" : m % 30 === 0 ? "half" : "quarter";
  return { top: m * PX_PER_MIN, kind };
});

const TICK_BORDER: Record<Tick["kind"], string> = {
  hour: "2px solid var(--pixel-ink-soft)",
  half: "1px solid var(--pixel-border)",
  quarter: "1px dashed var(--pixel-border)",
};

const HOUR_LABELS = Array.from({ length: GRID_TOTAL_MIN / 60 + 1 }, (_, i) => ({
  top: i * 60 * PX_PER_MIN,
  label: `${9 + i}시`,
}));

function sessionBlockRect(session: CourseSession): { top: number; height: number } | null {
  const [sh, sm] = session.start_time.split(":").map(Number);
  const [eh, em] = session.end_time.split(":").map(Number);
  const startMin = sh * 60 + sm - GRID_START_MIN;
  const endMin = eh * 60 + em - GRID_START_MIN;
  const clippedStart = Math.min(Math.max(startMin, 0), GRID_TOTAL_MIN);
  const clippedEnd = Math.min(Math.max(endMin, 0), GRID_TOTAL_MIN);
  if (clippedEnd <= clippedStart) return null;
  return { top: clippedStart * PX_PER_MIN, height: clippedEnd * PX_PER_MIN - clippedStart * PX_PER_MIN };
}

export function TimetableTab({ userId }: TimetableTabProps) {
  const [courses, setCourses] = useState<CourseWithSessions[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithSessions | null>(null);

  useEffect(() => {
    const supabase = createClient();
    fetchCoursesWithSessions(supabase, userId).then(setCourses);
  }, [userId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-cute text-3xl font-bold">시간표</h1>
          <p className="font-body text-sm text-pixel-ink-soft">
            📚 등록한 수업은 주간 캘린더·일일 플래너에도 함께 보여요
          </p>
        </div>
        <PixelButton type="button" onClick={() => setAdding(true)}>
          + 과목 추가
        </PixelButton>
      </div>

      <PixelCard>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 560 }}>
            {/* 요일 헤더 */}
            <div className="flex">
              <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
              {COURSE_WEEKDAY_INDEXES.map((dow) => (
                <div key={dow} className="flex-1 text-center font-cute text-sm font-bold pb-1.5">
                  {KOREAN_WEEKDAY[dow]}
                </div>
              ))}
            </div>

            <div className="flex">
              {/* 시간 라벨 */}
              <div style={{ width: GUTTER_WIDTH, height: GRID_HEIGHT }} className="relative shrink-0">
                {HOUR_LABELS.map((h) => (
                  <span
                    key={h.top}
                    style={{ top: h.top - 7 }}
                    className="absolute right-1 font-body text-[11px] text-pixel-ink-soft"
                  >
                    {h.label}
                  </span>
                ))}
              </div>

              {/* 그리드 본체 */}
              <div
                style={{ height: GRID_HEIGHT }}
                className="relative flex-1 border-l-2 border-pixel-border"
              >
                {/* 구분선 레이어 */}
                <div className="absolute inset-0 pointer-events-none">
                  {TICKS.map((t) => (
                    <div
                      key={t.top}
                      style={{ top: t.top, borderTop: TICK_BORDER[t.kind] }}
                      className="absolute left-0 right-0"
                    />
                  ))}
                </div>

                {/* 요일 컬럼 + 수업 블록 레이어 */}
                <div className="absolute inset-0 flex">
                  {COURSE_WEEKDAY_INDEXES.map((dow) => (
                    <div
                      key={dow}
                      className="flex-1 relative border-r-2 border-pixel-border/40 last:border-r-0"
                    >
                      {courses.map((course) =>
                        course.sessions
                          .filter((s) => s.day_of_week === dow)
                          .map((session) => {
                            const rect = sessionBlockRect(session);
                            if (!rect) return null;
                            return (
                              <button
                                key={session.id}
                                type="button"
                                onClick={() => setSelectedCourse(course)}
                                style={{
                                  top: rect.top,
                                  height: rect.height,
                                  backgroundColor: course.color,
                                  color: "var(--pixel-chip-ink)",
                                }}
                                className="absolute left-0.5 right-0.5 overflow-hidden rounded-[8px] border-2 border-pixel-border px-1.5 py-1 text-left cursor-pointer hover:brightness-95 transition-[filter]"
                              >
                                <span className="block font-cute text-[11px] leading-tight font-bold truncate">
                                  {course.kind === "ta" ? "🧑‍🏫 " : ""}
                                  {course.title}
                                </span>
                                <span className="block font-body text-[10px] leading-tight opacity-80 truncate">
                                  {session.start_time.slice(0, 5)}~{session.end_time.slice(0, 5)}
                                </span>
                              </button>
                            );
                          }),
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PixelCard>

      {courses.length > 0 && (
        <PixelCard>
          <h2 className="font-cute text-xl mb-2">📋 등록한 과목</h2>
          <ul className="flex flex-col gap-1.5">
            {courses.map((course) => (
              <li key={course.id}>
                <button
                  type="button"
                  onClick={() => setSelectedCourse(course)}
                  className="flex items-center gap-2 w-full text-left font-body text-sm px-2.5 py-1.5 border-2 border-pixel-border rounded-[8px] cursor-pointer hover:-translate-y-0.5 transition-transform"
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <span className="font-bold">{course.title}</span>
                  <span className="text-pixel-ink-soft text-xs px-1.5 py-0.5 border border-pixel-border rounded-full">
                    {courseKindLabel(course.kind)}
                  </span>
                  {course.professor && (
                    <span className="text-pixel-ink-soft text-xs">{course.professor} 교수님</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </PixelCard>
      )}

      <AddCourseModal
        open={adding}
        onClose={() => setAdding(false)}
        userId={userId}
        onCreated={(course) => setCourses((prev) => [...prev, course])}
      />

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
    </div>
  );
}
