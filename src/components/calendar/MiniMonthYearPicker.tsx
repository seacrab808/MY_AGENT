"use client";

import { useState } from "react";
import { isSameMonth, setMonth, setYear } from "date-fns";
import { PixelIconButton } from "@/components/ui/PixelIconButton";

const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

interface MiniMonthYearPickerProps {
  value: Date;
  onSelect: (date: Date) => void;
}

// 월간 캘린더 상단 날짜 클릭 시 뜨는 연/월 선택기. 너무 먼 미래까지 고를 필요는 없어서
// 연도는 지금으로부터 3년 뒤까지만 이동 가능(과거는 제한 없음).
export function MiniMonthYearPicker({ value, onSelect }: MiniMonthYearPickerProps) {
  const maxYear = new Date().getFullYear() + 3;
  const [viewYear, setViewYear] = useState(() => value.getFullYear());

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <PixelIconButton onClick={() => setViewYear((y) => y - 1)} aria-label="이전 연도">
          {"<"}
        </PixelIconButton>
        <h3 className="font-cute text-xl">{viewYear}년</h3>
        <PixelIconButton
          onClick={() => setViewYear((y) => Math.min(y + 1, maxYear))}
          disabled={viewYear >= maxYear}
          aria-label="다음 연도"
        >
          {">"}
        </PixelIconButton>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {MONTH_LABELS.map((label, index) => {
          const candidate = setMonth(setYear(value, viewYear), index);
          const selected = viewYear === value.getFullYear() && isSameMonth(candidate, value);

          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(candidate)}
              className={`py-2.5 rounded-[10px] border-2 font-cute text-base cursor-pointer transition-transform ${
                selected
                  ? "border-pixel-border bg-pixel-blue"
                  : "border-transparent hover:border-pixel-border hover:-translate-y-0.5"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
