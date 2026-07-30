"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { PixelIconButton } from "@/components/ui/PixelIconButton";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface MiniDatePickerProps {
  value: Date;
  onSelect: (date: Date) => void;
}

export function MiniDatePicker({ value, onSelect }: MiniDatePickerProps) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value));

  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <PixelIconButton onClick={() => setViewMonth((d) => subMonths(d, 1))} aria-label="이전 달">
          {"<"}
        </PixelIconButton>
        <h3 className="font-cute text-xl">{format(viewMonth, "yyyy년 M월")}</h3>
        <PixelIconButton onClick={() => setViewMonth((d) => addMonths(d, 1))} aria-label="다음 달">
          {">"}
        </PixelIconButton>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="font-cute text-center text-sm text-pixel-ink-soft">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const selected = isSameDay(day, value);
          const todayFlag = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={`aspect-square flex items-center justify-center rounded-[8px] border-2 font-cute text-base cursor-pointer transition-transform ${
                selected
                  ? "border-pixel-border bg-pixel-blue"
                  : todayFlag
                    ? "border-pixel-border bg-pixel-yellow/60"
                    : "border-transparent hover:border-pixel-border hover:-translate-y-0.5"
              } ${!inMonth ? "opacity-35" : ""}`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
