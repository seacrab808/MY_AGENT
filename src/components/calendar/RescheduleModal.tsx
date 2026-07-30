"use client";

import { useState } from "react";
import { addDays, format, nextMonday, parseISO } from "date-fns";
import { toDateKey, KOREAN_WEEKDAY } from "@/lib/date";
import { PixelModal } from "@/components/ui/PixelModal";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import type { PlannerEvent } from "@/types/event";

interface RescheduleModalProps {
  event: PlannerEvent;
  baseDateKey: string;
  onClose: () => void;
  onConfirm: (newDateKey: string) => void;
}

function dayLabel(date: Date): string {
  return `${format(date, "M/d")} (${KOREAN_WEEKDAY[date.getDay()]})`;
}

export function RescheduleModal({ event, baseDateKey, onClose, onConfirm }: RescheduleModalProps) {
  const baseDate = parseISO(baseDateKey);
  const tomorrow = addDays(baseDate, 1);
  const dayAfterTomorrow = addDays(baseDate, 2);
  const monday = nextMonday(baseDate);

  const [pickingCustom, setPickingCustom] = useState(false);
  const [customDate, setCustomDate] = useState(toDateKey(tomorrow));

  const options: { label: string; dateKey: string; date: Date }[] = [
    { label: "내일로 미루기", dateKey: toDateKey(tomorrow), date: tomorrow },
    { label: "모레로 미루기", dateKey: toDateKey(dayAfterTomorrow), date: dayAfterTomorrow },
    { label: "다음 주 월요일로", dateKey: toDateKey(monday), date: monday },
  ];

  return (
    <PixelModal open onClose={onClose} title="언제로 미룰까요?" emoji="📅">
      <p className="font-body text-sm text-pixel-ink-soft mb-3">
        &ldquo;{event.title}&rdquo; 일정은 오늘 X로 표시하고, 고른 날짜에 새 일정으로 등록할게요.
      </p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.dateKey}
            type="button"
            onClick={() => onConfirm(opt.dateKey)}
            className="flex items-center justify-between gap-2 font-body text-sm px-3 py-2.5 border-2 border-pixel-border rounded-[10px] bg-pixel-bg hover:-translate-y-0.5 transition-transform cursor-pointer text-left"
          >
            <span className="font-medium">{opt.label}</span>
            <span className="text-pixel-ink-soft text-xs shrink-0">{dayLabel(opt.date)}</span>
          </button>
        ))}

        {pickingCustom ? (
          <div className="flex items-center gap-2">
            <PixelInput
              type="date"
              value={customDate}
              min={baseDateKey}
              onChange={(e) => setCustomDate(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <PixelButton
              type="button"
              className="text-sm px-3 py-1.5 shrink-0"
              onClick={() => onConfirm(customDate)}
            >
              확인
            </PixelButton>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickingCustom(true)}
            className="flex items-center gap-2 font-body text-sm px-3 py-2.5 border-2 border-dashed border-pixel-border rounded-[10px] bg-pixel-bg hover:-translate-y-0.5 transition-transform cursor-pointer text-left"
          >
            <span className="font-medium">📅 날짜 직접 선택</span>
          </button>
        )}
      </div>

      <PixelButton type="button" tone="ink" className="w-full mt-3 text-sm py-1.5" onClick={onClose}>
        취소
      </PixelButton>
    </PixelModal>
  );
}
