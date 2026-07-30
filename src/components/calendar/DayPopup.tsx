"use client";

import { useState } from "react";
import { PixelModal } from "@/components/ui/PixelModal";
import { PixelButton } from "@/components/ui/PixelButton";
import { EventList } from "@/components/calendar/EventList";
import { EventForm } from "@/components/calendar/EventForm";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import type { PlannerEvent } from "@/types/event";

interface DayPopupProps {
  dateKey: string | null;
  events: PlannerEvent[];
  onClose: () => void;
  userId: string;
  onEventCreated: (event: PlannerEvent) => void;
  onEventUpdated: (event: PlannerEvent) => void;
  onEventDeleted: (eventId: string) => void;
  onEventDuplicated: (event: PlannerEvent) => void;
}

export function DayPopup({
  dateKey,
  events,
  onClose,
  userId,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
  onEventDuplicated,
}: DayPopupProps) {
  const [adding, setAdding] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);

  if (!dateKey) return null;

  return (
    <PixelModal
      open={Boolean(dateKey)}
      onClose={() => {
        setAdding(false);
        onClose();
      }}
      title={dateKey}
      emoji="📅"
    >
      <EventList events={events} onSelect={setSelectedEvent} />

      {adding ? (
        <div className="mt-3 pt-3 border-t-2 border-pixel-border">
          <EventForm
            userId={userId}
            dateKey={dateKey}
            visibility="month"
            onSaved={(event) => {
              onEventCreated(event);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <PixelButton type="button" className="mt-3 w-full" onClick={() => setAdding(true)}>
          + 일정 추가
        </PixelButton>
      )}

      {selectedEvent && (
        <EventDetailModal
          key={selectedEvent.id}
          event={selectedEvent}
          userId={userId}
          onClose={() => setSelectedEvent(null)}
          onUpdated={(updated) => {
            onEventUpdated(updated);
            setSelectedEvent(updated);
          }}
          onDeleted={(id) => {
            onEventDeleted(id);
            setSelectedEvent(null);
          }}
          onDuplicated={onEventDuplicated}
        />
      )}
    </PixelModal>
  );
}
