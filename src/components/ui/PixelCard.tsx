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

interface PixelCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  heading?: ReactNode;
  tone?: Tone;
  bodyClassName?: string;
}

export function PixelCard({
  className = "",
  bodyClassName = "",
  heading,
  tone = "blue",
  children,
  ...rest
}: PixelCardProps) {
  return (
    <div
      className={`relative bg-pixel-panel border-[3px] border-pixel-border rounded-[14px] shadow-[var(--pixel-shadow-lg)] overflow-hidden ${className}`}
      {...rest}
    >
      <span className="pixel-rivet top-1 left-1 rounded-[1px]" />
      <span className="pixel-rivet top-1 right-1 rounded-[1px]" />
      <span className="pixel-rivet bottom-1 left-1 rounded-[1px]" />
      <span className="pixel-rivet bottom-1 right-1 rounded-[1px]" />

      {heading && (
        <div
          className={`font-cute text-xl px-4 py-2 border-b-[3px] border-pixel-border ${titleBarTone[tone]}`}
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
