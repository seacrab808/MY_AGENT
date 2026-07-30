"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createEvent, PASTEL_COLOR_PRESETS, updateEvent } from "@/lib/events";
import type { EventCategory, EventVisibility, PlannerEvent } from "@/types/event";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";

const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: "general", label: "일반" },
  { value: "meeting", label: "미팅/세미나" },
  { value: "exam", label: "시험" },
  { value: "dday", label: "디데이" },
];

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
  const [color, setColor] = useState<string>(initialEvent?.color ?? PASTEL_COLOR_PRESETS[0].value);
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
      color,
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
        autoFocus
      />

      <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
        <input type="checkbox" checked={isRange} onChange={(e) => setIsRange(e.target.checked)} />
        여러 날에 걸친 일정이에요 (여행 등)
      </label>

      <div className="flex items-center gap-2">
        <PixelInput
          type="date"
          value={eventDate}
          disabled={!isEdit}
          onChange={(e) => setEventDate(e.target.value)}
          className={`flex-1 ${isEdit ? "" : "opacity-70"}`}
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
            />
          </>
        )}
      </div>

      <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
        <input type="checkbox" checked={hasTime} onChange={(e) => setHasTime(e.target.checked)} />
        시간을 지정할게요
      </label>

      {hasTime && (
        <div className="flex items-center gap-2">
          <PixelInput type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1" />
          <span className="font-cute">~</span>
          <PixelInput
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="flex-1"
          />
        </div>
      )}
      {hasTime && !endTime && (
        <p className="font-body text-xs text-pixel-ink-soft -mt-2">
          종료 시간을 안 정하면 {category === "meeting" ? "2시간" : "1시간"} 뒤로 자동 설정돼요.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => setCategory(opt.value)}
            className={`font-body text-sm px-2.5 py-1 rounded-[8px] border-2 border-pixel-border cursor-pointer ${
              category === opt.value ? "bg-pixel-yellow text-pixel-chip-ink" : "bg-pixel-bg"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PASTEL_COLOR_PRESETS.map((preset) => (
          <button
            type="button"
            key={preset.value}
            aria-label={preset.name}
            title={preset.name}
            onClick={() => setColor(preset.value)}
            className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
              color === preset.value ? "border-pixel-border scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: preset.value }}
          />
        ))}
      </div>

      <textarea
        placeholder="메모 (선택)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="font-body text-sm px-3 py-2 border-[3px] border-pixel-border rounded-[10px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft resize-none focus:outline-none focus:ring-2 focus:ring-pixel-blue"
      />

      {error && <p className="font-body text-sm text-pixel-red">{error}</p>}

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
