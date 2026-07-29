import { format } from "date-fns";
import { PixelModal } from "@/components/ui/PixelModal";
import { EventList } from "@/components/calendar/EventList";
import type { PlannerEvent } from "@/types/event";

interface WeeklyPopupProps {
  open: boolean;
  onClose: () => void;
  weekStart: Date;
  weekEnd: Date;
  events: PlannerEvent[];
}

export function WeeklyPopup({ open, onClose, weekStart, weekEnd, events }: WeeklyPopupProps) {
  return (
    <PixelModal
      open={open}
      onClose={onClose}
      title={`이번 주 (${format(weekStart, "M/d")} ~ ${format(weekEnd, "M/d")})`}
      emoji="🗓️"
    >
      <EventList events={events} />
    </PixelModal>
  );
}
