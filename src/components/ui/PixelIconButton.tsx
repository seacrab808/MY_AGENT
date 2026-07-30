"use client";

import { ButtonHTMLAttributes } from "react";

type Tone = "yellow" | "red" | "blue" | "ink" | "panel";

const toneClasses: Record<Tone, string> = {
  yellow: "bg-gradient-to-b from-[#ffedb0] to-pixel-yellow text-pixel-chip-ink",
  red: "bg-gradient-to-b from-[#ffb3b3] to-pixel-red text-pixel-chip-ink",
  blue: "bg-gradient-to-b from-[#b7cfff] to-pixel-blue text-pixel-chip-ink",
  ink: "bg-gradient-to-b from-[#4a4f82] to-pixel-ink text-pixel-bg",
  panel: "bg-pixel-panel text-pixel-ink",
};

interface PixelIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
}

export function PixelIconButton({
  tone = "yellow",
  className = "",
  children,
  ...rest
}: PixelIconButtonProps) {
  return (
    <button
      className={`font-pixel text-[10px] leading-none min-w-[44px] min-h-[44px] flex items-center justify-center px-2 py-2 border-[3px] border-pixel-border rounded-[8px] shadow-[var(--pixel-bevel)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--pixel-bevel-active)] transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
