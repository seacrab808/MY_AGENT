"use client";

import type { ReactNode } from "react";

interface PixelCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}

export function PixelCheckbox({ checked, onChange, children, disabled }: PixelCheckboxProps) {
  return (
    <label
      className={`flex items-center gap-2 font-cute text-base ${disabled ? "opacity-50" : "cursor-pointer"}`}
    >
      <span className="relative inline-flex shrink-0 w-5 h-5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer appearance-none w-5 h-5 m-0 border-2 border-pixel-border rounded-[6px] bg-pixel-bg shadow-[inset_1px_1px_0_0_rgba(0,0,0,0.12)] cursor-pointer checked:bg-pixel-yellow transition-colors disabled:cursor-not-allowed"
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
