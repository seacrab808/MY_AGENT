"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_COLOR_HEX, categoryLabel, createEvent, updateEvent } from "@/lib/events";
import type { EventCategory, EventVisibility, PlannerEvent } from "@/types/event";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCheckbox } from "@/components/ui/PixelCheckbox";

const CATEGORY_OPTIONS: EventCategory[] = ["general", "travel", "important", "meeting", "conference"];

// PixelInput 등 공용 컴포넌트는 font-body가 기본이라, 이 폼 안에서만 귀여운 손글씨 폰트로 강제 override
const CUTE_FONT: CSSProperties = { fontFamily: "var(--font-cute)" };

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
        <PixelInput
          type="date"
          value={eventDate}
          disabled={!isEdit}
          onChange={(e) => setEventDate(e.target.value)}
          className={`flex-1 ${isEdit ? "" : "opacity-70"}`}
          style={CUTE_FONT}
        />
        {isRange && (
          <>
            <span className="font-cute">~</span>
            <PixelInput
              type="date"
              value={endDate}
              min={eventDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1"
              style={CUTE_FONT}
            />
          </>
        )}
      </div>

      <PixelCheckbox checked={hasTime} onChange={setHasTime}>
        시간을 지정할게요
      </PixelCheckbox>

      {hasTime && (
        <div className="flex items-center gap-2">
          <PixelInput
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1"
            style={CUTE_FONT}
          />
          <span className="font-cute">~</span>
          <PixelInput
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="flex-1"
            style={CUTE_FONT}
          />
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
