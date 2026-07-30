"use client";

import type { ReactNode } from "react";

type CheckTone = "yellow" | "mint" | "blue" | "purple" | "pink";

interface PixelCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
  disabled?: boolean;
  tone?: CheckTone;
  className?: string;
}

const toneClasses: Record<CheckTone, string> = {
  yellow: "checked:bg-pixel-yellow checked:border-pixel-yellow",
  mint: "checked:bg-pixel-mint checked:border-pixel-mint",
  blue: "checked:bg-pixel-blue checked:border-pixel-blue",
  purple: "checked:bg-pixel-purple checked:border-pixel-purple",
  pink: "checked:bg-pixel-pink checked:border-pixel-pink",
};

// 동글동글한 다이어리 느낌의 원형 체크박스 (기존 각진 박스 체크박스 대체)
export function PixelCheckbox({
  checked,
  onChange,
  children,
  disabled,
  tone = "mint",
  className = "",
}: PixelCheckboxProps) {
  return (
    <label
      className={`flex items-center gap-2 font-cute text-base ${disabled ? "opacity-50" : "cursor-pointer"} ${className}`}
    >
      <span className="relative inline-flex shrink-0 w-5 h-5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className={`peer appearance-none w-5 h-5 m-0 border-2 border-pixel-border/60 rounded-full bg-pixel-bg cursor-pointer transition-colors disabled:cursor-not-allowed ${toneClasses[tone]}`}
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--pixel-chip-ink)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute inset-0 w-5 h-5 p-[3px] opacity-0 scale-75 peer-checked:opacity-100 peer-checked:scale-100 transition-all"
        >
          <polyline points="4 12 9 17 20 6" />
        </svg>
      </span>
      {children}
    </label>
  );
}
