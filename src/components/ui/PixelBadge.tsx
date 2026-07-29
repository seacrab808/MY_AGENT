import { HTMLAttributes } from "react";

type Tone = "blue" | "pink" | "yellow" | "mint" | "purple" | "red";

const toneClasses: Record<Tone, string> = {
  blue: "bg-pixel-blue",
  pink: "bg-pixel-pink",
  yellow: "bg-pixel-yellow",
  mint: "bg-pixel-mint",
  purple: "bg-pixel-purple",
  red: "bg-pixel-red",
};

interface PixelBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function PixelBadge({ tone = "blue", className = "", children, ...rest }: PixelBadgeProps) {
  return (
    <span
      className={`inline-block font-pixel text-[10px] leading-none px-2 py-1.5 border-2 border-pixel-border rounded-[6px] text-pixel-ink ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
