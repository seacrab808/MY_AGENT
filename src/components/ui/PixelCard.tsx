import { HTMLAttributes, ReactNode } from "react";

type Tone = "blue" | "pink" | "yellow" | "mint" | "purple" | "red";

const titleBarTone: Record<Tone, string> = {
  blue: "bg-pixel-blue text-pixel-chip-ink",
  pink: "bg-pixel-pink text-pixel-chip-ink",
  yellow: "bg-pixel-yellow text-pixel-chip-ink",
  mint: "bg-pixel-mint text-pixel-chip-ink",
  purple: "bg-pixel-purple text-pixel-chip-ink",
  red: "bg-pixel-red text-pixel-chip-ink",
};

const tapeTone: Record<Tone, string> = {
  blue: "bg-pixel-blue",
  pink: "bg-pixel-pink",
  yellow: "bg-pixel-yellow",
  mint: "bg-pixel-mint",
  purple: "bg-pixel-purple",
  red: "bg-pixel-red",
};

interface PixelCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  heading?: ReactNode;
  tone?: Tone;
  bodyClassName?: string;
  /** 카드 우상단에 붙이는 작은 마스킹테이프 장식(washi tape). 지정한 톤 색으로 렌더링됨. */
  tape?: Tone;
}

export function PixelCard({
  className = "",
  bodyClassName = "",
  heading,
  tone = "blue",
  tape,
  children,
  ...rest
}: PixelCardProps) {
  return (
    <div
      className={`relative bg-pixel-panel border-2 border-pixel-border rounded-[18px] shadow-[var(--pixel-shadow-lg)] overflow-hidden ${className}`}
      {...rest}
    >
      {tape && <span className={`washi-tape ${tapeTone[tape]}`} aria-hidden />}

      {heading && (
        <div
          className={`font-cute text-xl px-4 py-2 border-b-2 border-pixel-border ${titleBarTone[tone]}`}
        >
          {heading}
        </div>
      )}

      {/* className is intentionally re-applied here so layout utilities
          (flex, items-*, h-full, text-*) passed by callers reach the
          actual content container, not just the outer frame. */}
      <div className={`p-3 sm:p-4 ${className} ${bodyClassName}`}>{children}</div>
    </div>
  );
}
