"use client";

import { ButtonHTMLAttributes } from "react";

type Tone = "blue" | "pink" | "yellow" | "mint" | "purple" | "ink" | "red";

const toneClasses: Record<Tone, string> = {
  blue: "bg-gradient-to-b from-[#b7cfff] to-pixel-blue text-pixel-ink",
  pink: "bg-gradient-to-b from-[#ffd6e6] to-pixel-pink text-pixel-ink",
  yellow: "bg-gradient-to-b from-[#ffedb0] to-pixel-yellow text-pixel-ink",
  mint: "bg-gradient-to-b from-[#cdf5e0] to-pixel-mint text-pixel-ink",
  purple: "bg-gradient-to-b from-[#e6d8ff] to-pixel-purple text-pixel-ink",
  red: "bg-gradient-to-b from-[#ffb3b3] to-pixel-red text-pixel-ink",
  ink: "bg-gradient-to-b from-[#4a4f82] to-pixel-ink text-pixel-bg",
};

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
}

export function PixelButton({
  tone = "blue",
  className = "",
  children,
  ...rest
}: PixelButtonProps) {
  return (
    <button
      className={`font-cute text-lg px-4 py-2 border-[3px] border-pixel-border rounded-[10px] shadow-[var(--pixel-bevel)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--pixel-bevel-active)] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[var(--pixel-bevel)] cursor-pointer ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
