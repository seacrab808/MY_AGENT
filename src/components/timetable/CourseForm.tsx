"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toDateKey, KOREAN_WEEKDAY } from "@/lib/date";
import {
  COURSE_COLOR_PALETTE,
  COURSE_WEEKDAY_INDEXES,
  courseKindLabel,
  createCourse,
  updateCourse,
  type CourseSessionInput,
} from "@/lib/courses";
import type { CourseKind, CourseWithSessions } from "@/types/course";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelModal } from "@/components/ui/PixelModal";
import { MiniDatePicker } from "@/components/calendar/MiniDatePicker";

const CUTE_FONT: CSSProperties = { fontFamily: "var(--font-cute)" };

const FIELD_BASE_CLASS =
  "border-[3px] border-pixel-border rounded-[10px] bg-pixel-bg text-pixel-ink shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-pixel-blue";

function formatDateLabel(dateKey: string): string {
  if (!dateKey) return "날짜 선택";
  const d = parseISO(dateKey);
  return `${format(d, "yyyy년 M월 d일")} (${KOREAN_WEEKDAY[d.getDay()]})`;
}

interface DateFieldProps {
  value: string;
  onSelect: (dateKey: string) => void;
  min?: string;
  className?: string;
}

function DateField({ value, onSelect, min, className = "" }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={CUTE_FONT}
        className={`${FIELD_BASE_CLASS} text-base text-left px-3 py-2 cursor-pointer ${className}`}
      >
        📅 {formatDateLabel(value)}
      </button>
      <PixelModal open={open} onClose={() => setOpen(false)} title="날짜 선택" emoji="📅">
        <MiniDatePicker
          value={parseISO(value || toDateKey(new Date()))}
          onSelect={(d) => {
            const key = toDateKey(d);
            if (min && key < min) return;
            onSelect(key);
            setOpen(false);
          }}
        />
      </PixelModal>
    </>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const QUARTER_MINUTES = ["00", "15", "30", "45"];

interface TimeSelectProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  className?: string;
}

// 15분 단위 시간표 그리드에 맞춰, 일반 EventForm의 5분 단위 TimeSelect 대신 15분 단위로만 고름
function TimeSelect({ value, onChange, className = "" }: TimeSelectProps) {
  const [rawHour, rawMinute] = value ? value.split(":") : ["09", "00"];
  const hour = rawHour || "09";
  const minute = QUARTER_MINUTES.includes(rawMinute) ? rawMinute : "00";

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <select
        style={CUTE_FONT}
        className={`${FIELD_BASE_CLASS} text-base px-2 py-2 cursor-pointer`}
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute}`)}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}시
          </option>
        ))}
      </select>
      <select
        style={CUTE_FONT}
        className={`${FIELD_BASE_CLASS} text-base px-2 py-2 cursor-pointer`}
        value={minute}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
      >
        {QUARTER_MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}분
          </option>
        ))}
      </select>
    </div>
  );
}

interface SessionRow {
  key: string;
  day_of_week: number;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

let sessionKeySeq = 0;
function newSessionRow(day_of_week = 1): SessionRow {
  sessionKeySeq += 1;
  return { key: `s${sessionKeySeq}`, day_of_week, start_time: "09:00", end_time: "10:00" };
}

interface CourseFormProps {
  userId: string;
  onSaved: (course: CourseWithSessions) => void;
  onCancel?: () => void;
  initialCourse?: CourseWithSessions;
}

export function CourseForm({ userId, onSaved, onCancel, initialCourse }: CourseFormProps) {
  const isEdit = Boolean(initialCourse);
  const today = toDateKey(new Date());

  const [title, setTitle] = useState(initialCourse?.title ?? "");
  const [professor, setProfessor] = useState(initialCourse?.professor ?? "");
  const [kind, setKind] = useState<CourseKind>(initialCourse?.kind ?? "class");
  const [color, setColor] = useState(initialCourse?.color ?? COURSE_COLOR_PALETTE[0]);
  const [semesterStart, setSemesterStart] = useState(initialCourse?.semester_start ?? today);
  const [semesterEnd, setSemesterEnd] = useState(initialCourse?.semester_end ?? today);
  const [notes, setNotes] = useState(initialCourse?.notes ?? "");
  const [sessions, setSessions] = useState<SessionRow[]>(() =>
    initialCourse && initialCourse.sessions.length > 0
      ? initialCourse.sessions.map((s) => {
          sessionKeySeq += 1;
          return {
            key: `s${sessionKeySeq}`,
            day_of_week: s.day_of_week,
            start_time: s.start_time.slice(0, 5),
            end_time: s.end_time.slice(0, 5),
          };
        })
      : [newSessionRow()],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSession(key: string, patch: Partial<SessionRow>) {
    setSessions((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function removeSession(key: string) {
    setSessions((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("과목명을 입력해주세요.");
      return;
    }
    if (semesterEnd < semesterStart) {
      setError("종료일이 시작일보다 빠를 수 없어요.");
      return;
    }
    const invalidSession = sessions.find((s) => s.end_time <= s.start_time);
    if (invalidSession) {
      setError("수업 종료 시간은 시작 시간보다 늦어야 해요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const input = {
      title: title.trim(),
      professor: professor.trim() || null,
      kind,
      color,
      semester_start: semesterStart,
      semester_end: semesterEnd,
      notes: notes.trim() || null,
      sessions: sessions.map<CourseSessionInput>((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    };

    const { course, error: err } = isEdit
      ? await updateCourse(supabase, userId, initialCourse!.id, input)
      : await createCourse(supabase, userId, input);

    setSubmitting(false);
    if (err || !course) {
      setError(err ?? "과목 저장에 실패했어요.");
      return;
    }
    onSaved(course);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <PixelInput
        placeholder="과목명"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={CUTE_FONT}
        autoFocus
      />
      <PixelInput
        placeholder="교수님 성함 (선택)"
        value={professor}
        onChange={(e) => setProfessor(e.target.value)}
        style={CUTE_FONT}
      />

      <div className="flex gap-2">
        {(["class", "ta"] as CourseKind[]).map((opt) => {
          const selected = kind === opt;
          return (
            <button
              type="button"
              key={opt}
              onClick={() => setKind(opt)}
              className="font-cute text-base px-3 py-1.5 rounded-full border-2 cursor-pointer transition-transform"
              style={{
                borderColor: "var(--pixel-border)",
                backgroundColor: selected ? "var(--pixel-purple)" : "var(--pixel-bg)",
                color: selected ? "var(--pixel-chip-ink)" : "var(--pixel-ink)",
                transform: selected ? "scale(1.05)" : undefined,
              }}
            >
              {courseKindLabel(opt)}
            </button>
          );
        })}
      </div>

      <div>
        <p className="font-cute text-sm text-pixel-ink-soft mb-1">색상</p>
        <div className="flex flex-wrap gap-2">
          {COURSE_COLOR_PALETTE.map((hex) => (
            <button
              type="button"
              key={hex}
              onClick={() => setColor(hex)}
              aria-label={hex}
              className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                color === hex ? "border-pixel-ink scale-110" : "border-pixel-border"
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="font-cute text-sm text-pixel-ink-soft">수업 시간</p>
          <button
            type="button"
            onClick={() => setSessions((prev) => [...prev, newSessionRow()])}
            className="font-cute text-xs text-pixel-ink-soft underline cursor-pointer"
          >
            + 시간 추가
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 flex-wrap">
              <select
                style={CUTE_FONT}
                className={`${FIELD_BASE_CLASS} text-base px-2 py-2 cursor-pointer`}
                value={s.day_of_week}
                onChange={(e) => updateSession(s.key, { day_of_week: Number(e.target.value) })}
              >
                {COURSE_WEEKDAY_INDEXES.map((d) => (
                  <option key={d} value={d}>
                    {KOREAN_WEEKDAY[d]}요일
                  </option>
                ))}
              </select>
              <TimeSelect value={s.start_time} onChange={(v) => updateSession(s.key, { start_time: v })} />
              <span className="font-cute">~</span>
              <TimeSelect value={s.end_time} onChange={(v) => updateSession(s.key, { end_time: v })} />
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSession(s.key)}
                  className="font-cute text-sm text-pixel-red cursor-pointer px-1"
                  aria-label="시간 삭제"
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-cute text-sm text-pixel-ink-soft mb-1">학기 기간</p>
        <div className="flex items-center gap-2">
          <DateField value={semesterStart} onSelect={setSemesterStart} className="flex-1" />
          <span className="font-cute">~</span>
          <DateField value={semesterEnd} min={semesterStart} onSelect={setSemesterEnd} className="flex-1" />
        </div>
      </div>

      <textarea
        placeholder="메모 (선택) — 뭘 하는 수업인지, 발표/프로젝트 위주인지, 중간·기말 일정 등"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        style={CUTE_FONT}
        className="text-base px-3 py-2 border-[3px] border-pixel-border rounded-[10px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft resize-none focus:outline-none focus:ring-2 focus:ring-pixel-blue"
      />

      {error && <p className="font-cute text-sm text-pixel-red">{error}</p>}

      <div className="flex gap-2">
        <PixelButton type="submit" disabled={submitting} className="flex-1">
          {submitting ? "저장 중..." : isEdit ? "수정 완료" : "과목 등록"}
        </PixelButton>
        {onCancel && (
          <PixelButton type="button" tone="ink" onClick={onCancel}>
            취소
          </PixelButton>
        )}
      </div>
    </form>
  );
}
