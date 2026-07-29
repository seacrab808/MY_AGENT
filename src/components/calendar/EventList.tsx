import type { PlannerEvent } from "@/types/event";
import { categoryLabel } from "@/lib/events";
import { PixelBadge } from "@/components/ui/PixelBadge";

const CATEGORY_TONE: Record<PlannerEvent["category"], "blue" | "red" | "purple" | "mint"> = {
  general: "blue",
  dday: "red",
  exam: "purple",
  meeting: "mint",
};

export function EventList({ events }: { events: PlannerEvent[] }) {
  if (events.length === 0) {
    return <p className="font-body text-pixel-ink-soft text-sm py-3">등록된 일정이 없어요.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-start gap-2 border-2 border-pixel-border rounded-[10px] p-2.5 bg-pixel-bg"
        >
          <PixelBadge tone={CATEGORY_TONE[event.category]}>{categoryLabel(event.category)}</PixelBadge>
          <div className="flex-1 min-w-0">
            <p className="font-cute text-lg leading-snug break-words">{event.title}</p>
            <p className="font-body text-xs text-pixel-ink-soft">
              {event.event_date}
              {event.event_time ? ` · ${event.event_time.slice(0, 5)}` : ""}
            </p>
            {event.description && (
              <p className="font-body text-sm mt-1 whitespace-pre-wrap break-words">
                {event.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
