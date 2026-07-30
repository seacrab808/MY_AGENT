interface ProgressBarProps {
  done: number;
  total: number;
  className?: string;
}

// 오늘의 Routine / 오늘의 TODO / 오늘의 일정 / 이달의 TODO에서 공용으로 쓰는
// 보라 -> 핑크 그라데이션 진행률 바.
export function ProgressBar({ done, total, className = "" }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2.5 rounded-full bg-pixel-border/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${percent}%`, background: "var(--gradient-cheer)" }}
        />
      </div>
      <span className="font-body text-xs text-pixel-ink-soft shrink-0 whitespace-nowrap">
        {done}/{total} {total > 0 ? `${percent}%` : ""}
      </span>
    </div>
  );
}
