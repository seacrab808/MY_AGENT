import { PixelModal } from "@/components/ui/PixelModal";
import { EventList } from "@/components/calendar/EventList";
import type { PlannerEvent } from "@/types/event";

interface DayPopupProps {
  dateKey: string | null;
  events: PlannerEvent[];
  onClose: () => void;
}

export function DayPopup({ dateKey, events, onClose }: DayPopupProps) {
  if (!dateKey) return null;

  return (
    <PixelModal open={Boolean(dateKey)} onClose={onClose} title={dateKey} emoji="📅">
      <EventList events={events} />
    </PixelModal>
  );
}
