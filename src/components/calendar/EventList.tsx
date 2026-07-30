import type { EventCheckStatus, PlannerEvent } from "@/types/event";
import { categoryLabel, eventColor } from "@/lib/events";

const CHECK_OPTIONS: { value: EventCheckStatus; label: string; activeClass: string }[] = [
  { value: "o", label: "O", activeClass: "bg-pixel-mint text-pixel-chip-ink" },
  { value: "triangle", label: "△", activeClass: "bg-pixel-yellow text-pixel-chip-ink" },
  { value: "x", label: "X", activeClass: "bg-pixel-red text-pixel-bg" },
];

interface EventListProps {
  events: PlannerEvent[];
  onSelect?: (event: PlannerEvent) => void;
  onSetCheckStatus?: (event: PlannerEvent, status: EventCheckStatus | null) => void;
}

export function EventList({ events, onSelect, onSetCheckStatus }: EventListProps) {
  if (events.length === 0) {
    return <p className="font-body text-pixel-ink-soft text-sm py-3">등록된 일정이 없어요.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((event) => {
        const isRange = Boolean(event.event_end_date) && event.event_end_date !== event.event_date;
        const dateLabel = isRange ? `${event.event_date} ~ ${event.event_end_date}` : event.event_date;
        const timeLabel = event.event_time
          ? `${event.event_time.slice(0, 5)}${event.end_time ? ` ~ ${event.end_time.slice(0, 5)}` : ""}`
          : "";

        const content = (
          <>
            <span
              className="inline-block font-pixel text-[10px] leading-none px-2 py-1.5 border-2 border-pixel-border rounded-[6px] shrink-0"
              style={{ backgroundColor: eventColor(event), color: "var(--pixel-chip-ink)" }}
            >
              {categoryLabel(event.category)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-cute text-lg leading-snug break-words">{event.title}</p>
              <p className="font-body text-xs text-pixel-ink-soft">
                {dateLabel}
                {timeLabel ? ` · ${timeLabel}` : ""}
              </p>
              {event.description && (
                <p className="font-body text-sm mt-1 whitespace-pre-wrap break-words">
                  {event.description}
                </p>
              )}
            </div>
          </>
        );

        const checkButtons = onSetCheckStatus && (
          <div className="flex items-center gap-1 shrink-0">
            {CHECK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetCheckStatus(event, event.check_status === opt.value ? null : opt.value);
                }}
                title={opt.label}
                className={`font-pixel text-[10px] min-w-[32px] min-h-[32px] flex items-center justify-center border-2 border-pixel-border rounded-[6px] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] ${
                  event.check_status === opt.value ? opt.activeClass : "bg-pixel-panel text-pixel-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );

        return (
          <li key={event.id}>
            <div className="flex items-stretch gap-2">
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(event)}
                  className="flex-1 min-w-0 flex items-start gap-2 border-2 border-pixel-border rounded-[10px] p-2.5 bg-pixel-bg text-left cursor-pointer hover:-translate-y-0.5 transition-transform"
                >
                  {content}
                </button>
              ) : (
                <div className="flex-1 min-w-0 flex items-start gap-2 border-2 border-pixel-border rounded-[10px] p-2.5 bg-pixel-bg">
                  {content}
                </div>
              )}
              {checkButtons}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
