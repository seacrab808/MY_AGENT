"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toDateKey, KOREAN_WEEKDAY } from "@/lib/date";
import { CATEGORY_COLOR_HEX, categoryLabel, createEvent, updateEvent } from "@/lib/events";
import type { EventCategory, EventVisibility, PlannerEvent } from "@/types/event";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCheckbox } from "@/components/ui/PixelCheckbox";
import { PixelModal } from "@/components/ui/PixelModal";
import { MiniDatePicker } from "@/components/calendar/MiniDatePicker";

const CATEGORY_OPTIONS: EventCategory[] = ["general", "travel", "important", "meeting", "conference"];

// PixelInput 등 공용 컴포넌트는 font-body가 기본이라, 이 폼 안에서만 귀여운 손글씨 폰트로 강제 override
const CUTE_FONT: CSSProperties = { fontFamily: "var(--font-cute)" };

// 나머지 폼 요소(PixelInput 등)와 톤을 맞춘 날짜/시간 필드 전용 스타일.
// 어차피 나중에 전체 디자인을 다시 손볼 예정이라, 딱 지금 스타일과 비슷하게만 맞춰둠.
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
  disabled?: boolean;
  min?: string;
  className?: string;
}

// 브라우저 기본 <input type="date"> 대신, 앱 톤에 맞춘 MiniDatePicker를 모달로 띄워서 선택
function DateField({ value, onSelect, disabled, min, className = "" }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        style={CUTE_FONT}
        className={`${FIELD_BASE_CLASS} text-base text-left px-3 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
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
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

interface TimeSelectProps {
  value: string; // "HH:MM" 또는 빈 문자열(미지정)
  onChange: (value: string) => void;
  allowEmpty?: boolean;
  className?: string;
}

// 브라우저 기본 <input type="time"> 대신, 시/분 드롭다운 두 개로 앱 톤에 맞춰 표시
function TimeSelect({ value, onChange, allowEmpty = false, className = "" }: TimeSelectProps) {
  const [rawHour, rawMinute] = value ? value.split(":") : ["", ""];
  const hour = rawHour || (allowEmpty ? "" : "09");
  const minute = MINUTES.includes(rawMinute) ? rawMinute : "00";

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <select
        style={CUTE_FONT}
        className={`${FIELD_BASE_CLASS} text-base px-2 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
        value={hour}
        onChange={(e) => onChange(e.target.value ? `${e.target.value}:${minute}` : "")}
      >
        {allowEmpty && <option value="">미지정</option>}
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}시
          </option>
        ))}
      </select>
      <select
        style={CUTE_FONT}
        className={`${FIELD_BASE_CLASS} text-base px-2 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
        value={minute}
        disabled={!hour}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}분
          </option>
        ))}
      </select>
    </div>
  );
}

interface EventFormProps {
  userId: string;
  onSaved: (event: PlannerEvent) => void;
  onCancel?: () => void;
  // 새 일정 등록 모드
  dateKey?: string; // 시작일 (고정)
  visibility?: EventVisibility;
  // 기존 일정 수정 모드
  initialEvent?: PlannerEvent;
}

export function EventForm({ userId, onSaved, onCancel, dateKey, visibility, initialEvent }: EventFormProps) {
  const isEdit = Boolean(initialEvent);
  const startDate = initialEvent?.event_date ?? dateKey ?? "";

  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [eventDate, setEventDate] = useState(startDate);
  const [isRange, setIsRange] = useState(
    Boolean(initialEvent?.event_end_date && initialEvent.event_end_date !== initialEvent.event_date),
  );
  const [endDate, setEndDate] = useState(initialEvent?.event_end_date ?? startDate);
  const [hasTime, setHasTime] = useState(Boolean(initialEvent?.event_time));
  const [time, setTime] = useState(initialEvent?.event_time?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(initialEvent?.end_time?.slice(0, 5) ?? "");
  const [category, setCategory] = useState<EventCategory>(initialEvent?.category ?? "general");
  const [displayAsBar, setDisplayAsBar] = useState(Boolean(initialEvent?.display_as_bar));
  const [description, setDescription] = useState(initialEvent?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const fields = {
      title: title.trim(),
      event_date: eventDate,
      event_end_date: isRange && endDate > eventDate ? endDate : null,
      event_time: hasTime && time ? time : null,
      end_time: hasTime && endTime ? endTime : null,
      description: description.trim() || null,
      category,
      display_as_bar: isRange ? true : displayAsBar,
    };

    const { event, error: err } = isEdit
      ? await updateEvent(supabase, initialEvent!.id, fields)
      : await createEvent(supabase, { ...fields, user_id: userId, visibility: visibility! });

    setSubmitting(false);
    if (err || !event) {
      setError(err ?? "일정 저장에 실패했어요.");
      return;
    }
    onSaved(event);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <PixelInput
        placeholder="일정 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={CUTE_FONT}
        autoFocus
      />

      <PixelCheckbox checked={isRange} onChange={setIsRange}>
        여러 날에 걸친 일정이에요 (여행 등)
      </PixelCheckbox>

      <PixelCheckbox checked={isRange || displayAsBar} disabled={isRange} onChange={setDisplayAsBar}>
        하루짜리여도 캘린더에 바 형태로 표시할게요 (여행처럼)
      </PixelCheckbox>
      {(isRange || displayAsBar) && (
        <p className="font-cute text-xs text-pixel-ink-soft -mt-2">
          바 형태 일정은 일일 플래너에서 완료 체크(O/X) 없이 그냥 일정으로만 표시돼요.
        </p>
      )}

      <div className="flex items-center gap-2">
        <DateField
          value={eventDate}
          disabled={!isEdit}
          onSelect={setEventDate}
          className={`flex-1 ${isEdit ? "" : "opacity-70"}`}
        />
        {isRange && (
          <>
            <span className="font-cute">~</span>
            <DateField value={endDate} min={eventDate} onSelect={setEndDate} className="flex-1" />
          </>
        )}
      </div>

      <PixelCheckbox
        checked={hasTime}
        onChange={(checked) => {
          setHasTime(checked);
          if (checked && !time) setTime("09:00");
        }}
      >
        시간을 지정할게요
      </PixelCheckbox>

      {hasTime && (
        <div className="flex items-center gap-2 flex-wrap">
          <TimeSelect value={time} onChange={setTime} />
          <span className="font-cute">~</span>
          <TimeSelect value={endTime} onChange={setEndTime} allowEmpty />
        </div>
      )}
      {hasTime && !endTime && (
        <p className="font-cute text-xs text-pixel-ink-soft -mt-2">
          종료 시간을 안 정하면 {category === "meeting" ? "2시간" : "1시간"} 뒤로 자동 설정돼요.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((opt) => {
          const selected = category === opt;
          return (
            <button
              type="button"
              key={opt}
              onClick={() => setCategory(opt)}
              className="font-cute text-base px-3 py-1.5 rounded-full border-2 cursor-pointer transition-transform"
              style={{
                borderColor: "var(--pixel-border)",
                backgroundColor: selected ? CATEGORY_COLOR_HEX[opt] : "var(--pixel-bg)",
                color: selected ? "var(--pixel-chip-ink)" : "var(--pixel-ink)",
                transform: selected ? "scale(1.05)" : undefined,
              }}
            >
              {!selected && (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle"
                  style={{ backgroundColor: CATEGORY_COLOR_HEX[opt] }}
                />
              )}
              {categoryLabel(opt)}
            </button>
          );
        })}
      </div>

      <textarea
        placeholder="메모 (선택)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        style={CUTE_FONT}
        className="text-base px-3 py-2 border-[3px] border-pixel-border rounded-[10px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft resize-none focus:outline-none focus:ring-2 focus:ring-pixel-blue"
      />

      {error && <p className="font-cute text-sm text-pixel-red">{error}</p>}

      <div className="flex gap-2">
        <PixelButton type="submit" disabled={submitting} className="flex-1">
          {submitting ? "저장 중..." : isEdit ? "수정 완료" : "일정 등록"}
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
