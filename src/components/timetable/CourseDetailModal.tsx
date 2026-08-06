"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { courseKindLabel, deleteCourse } from "@/lib/courses";
import { KOREAN_WEEKDAY } from "@/lib/date";
import type { CourseWithSessions } from "@/types/course";
import { PixelModal } from "@/components/ui/PixelModal";
import { PixelButton } from "@/components/ui/PixelButton";
import { CourseForm } from "@/components/timetable/CourseForm";

interface CourseDetailModalProps {
  course: CourseWithSessions;
  userId: string;
  onClose: () => void;
  onUpdated: (course: CourseWithSessions) => void;
  onDeleted: (courseId: string) => void;
}

// 부모에서 key={course.id}로 렌더링해야 과목이 바뀔 때 내부 상태(모드 등)가 새로 초기화됨
export function CourseDetailModal({ course, userId, onClose, onUpdated, onDeleted }: CourseDetailModalProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const supabase = createClient();
    const err = await deleteCourse(supabase, course.id);
    if (err) {
      setError(err);
      return;
    }
    onDeleted(course.id);
    onClose();
  }

  if (mode === "edit") {
    return (
      <PixelModal open onClose={onClose} title="과목 수정" emoji="✏️">
        <CourseForm
          userId={userId}
          initialCourse={course}
          onSaved={(updated) => {
            onUpdated(updated);
            setMode("view");
          }}
          onCancel={() => setMode("view")}
        />
      </PixelModal>
    );
  }

  return (
    <PixelModal open onClose={onClose} title={course.title} emoji="📚">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-block font-body text-xs px-2 py-1 border-2 border-pixel-border rounded-[6px]"
            style={{ backgroundColor: course.color, color: "var(--pixel-chip-ink)" }}
          >
            {courseKindLabel(course.kind)}
          </span>
          {course.professor && (
            <span className="font-body text-sm text-pixel-ink-soft">{course.professor} 교수님</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {course.sessions.map((s) => (
            <span key={s.id} className="font-body text-sm">
              🕒 {KOREAN_WEEKDAY[s.day_of_week]}요일 {s.start_time.slice(0, 5)} ~ {s.end_time.slice(0, 5)}
            </span>
          ))}
        </div>

        <span className="font-body text-sm text-pixel-ink-soft">
          📅 {course.semester_start} ~ {course.semester_end}
        </span>

        <div className="border-2 border-pixel-border rounded-[10px] p-2.5 bg-pixel-bg">
          {course.notes ? (
            <p className="font-body text-sm whitespace-pre-wrap break-words">{course.notes}</p>
          ) : (
            <p className="font-body text-sm text-pixel-ink-soft">메모가 없어요.</p>
          )}
        </div>

        {error && <p className="font-body text-sm text-pixel-red">{error}</p>}

        <div className="flex gap-2 pt-2 border-t-2 border-pixel-border">
          <PixelButton type="button" className="flex-1" onClick={() => setMode("edit")}>
            수정
          </PixelButton>
          {confirmingDelete ? (
            <>
              <PixelButton type="button" tone="red" onClick={handleDelete}>
                정말 삭제
              </PixelButton>
              <PixelButton type="button" tone="ink" onClick={() => setConfirmingDelete(false)}>
                취소
              </PixelButton>
            </>
          ) : (
            <PixelButton type="button" tone="red" onClick={() => setConfirmingDelete(true)}>
              삭제
            </PixelButton>
          )}
        </div>
      </div>
    </PixelModal>
  );
}
