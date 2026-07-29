import { PixelModal } from "@/components/ui/PixelModal";
import { EventList } from "@/components/calendar/EventList";
import type { PlannerEvent } from "@/types/event";

interface TodayPopupProps {
  open: boolean;
  onClose: () => void;
  todayLabel: string;
  events: PlannerEvent[];
}

export function TodayPopup({ open, onClose, todayLabel, events }: TodayPopupProps) {
  return (
    <PixelModal open={open} onClose={onClose} title={`오늘 (${todayLabel})`} emoji="☀️">
      <EventList events={events} />
    </PixelModal>
  );
}
