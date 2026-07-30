"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createEvent, PASTEL_COLOR_PRESETS } from "@/lib/events";
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
  dateKey: string; // 시작일 (고정)
  visibility: EventVisibility;
  onCreated: (event: PlannerEvent) => void;
  onCancel?: () => void;
}

export function EventForm({ userId, dateKey, visibility, onCreated, onCancel }: EventFormProps) {
  const [title, setTitle] = useState("");
  const [isRange, setIsRange] = useState(false);
  const [endDate, setEndDate] = useState(dateKey);
  const [hasTime, setHasTime] = useState(false);
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState<EventCategory>("general");
  const [color, setColor] = useState<string>(PASTEL_COLOR_PRESETS[0].value);
  const [description, setDescription] = useState("");
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
    const { event, error: err } = await createEvent(supabase, {
      user_id: userId,
      title: title.trim(),
      event_date: dateKey,
      event_end_date: isRange && endDate > dateKey ? endDate : null,
      event_time: hasTime && time ? time : null,
      end_time: hasTime && endTime ? endTime : null,
      description: description.trim() || null,
      category,
      color,
      visibility,
    });

    setSubmitting(false);
    if (err || !event) {
      setError(err ?? "일정 저장에 실패했어요.");
      return;
    }
    onCreated(event);
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
        <PixelInput type="date" value={dateKey} disabled className="flex-1 opacity-70" />
        {isRange && (
          <>
            <span className="font-cute">~</span>
            <PixelInput
              type="date"
              value={endDate}
              min={dateKey}
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
              category === opt.value ? "bg-pixel-yellow" : "bg-pixel-bg"
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
          {submitting ? "저장 중..." : "일정 등록"}
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
