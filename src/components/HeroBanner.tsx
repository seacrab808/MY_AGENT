import { ReactNode } from "react";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

// pixel cloud drawn with stacked box-shadow "pixels" — no image assets needed
const CLOUD =
  "shadow-[0_0_0_2px_#fff,8px_0_0_2px_#fff,16px_0_0_2px_#fff,4px_-8px_0_2px_#fff,12px_-8px_0_2px_#fff,4px_8px_0_2px_#fff,12px_8px_0_2px_#fff]";

export function HeroBanner({ title, subtitle, right }: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-[16px] border-[3px] border-pixel-border shadow-[var(--pixel-shadow-lg)] bg-gradient-to-b from-[var(--pixel-sky-top)] to-[var(--pixel-sky-bottom)] px-5 py-4">
      <span className={`absolute w-1 h-1 bg-white/0 top-6 left-10 opacity-70 ${CLOUD}`} />
      <span className={`absolute w-1 h-1 bg-white/0 top-4 right-24 opacity-60 ${CLOUD}`} />
      <span className={`absolute w-1 h-1 bg-white/0 bottom-3 left-1/3 opacity-50 ${CLOUD}`} />

      <div className="relative flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-pixel text-lg sm:text-2xl text-pixel-ink [text-shadow:2px_2px_0_#fff]">
            {title}
          </h1>
          {subtitle && (
            <p className="font-cute text-base text-pixel-ink/80 mt-1">{subtitle}</p>
          )}
        </div>
        {right && <div className="relative flex items-center gap-2">{right}</div>}
      </div>
    </div>
  );
}
