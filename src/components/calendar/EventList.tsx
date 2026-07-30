import type { PlannerEvent } from "@/types/event";
import { categoryLabel, eventColor } from "@/lib/events";

export function EventList({ events }: { events: PlannerEvent[] }) {
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

        return (
          <li
            key={event.id}
            className="flex items-start gap-2 border-2 border-pixel-border rounded-[10px] p-2.5 bg-pixel-bg"
          >
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
          </li>
        );
      })}
    </ul>
  );
}
