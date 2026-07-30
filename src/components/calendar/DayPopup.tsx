"use client";

import { useState } from "react";
import { PixelModal } from "@/components/ui/PixelModal";
import { PixelButton } from "@/components/ui/PixelButton";
import { EventList } from "@/components/calendar/EventList";
import { EventForm } from "@/components/calendar/EventForm";
import type { PlannerEvent } from "@/types/event";

interface DayPopupProps {
  dateKey: string | null;
  events: PlannerEvent[];
  onClose: () => void;
  userId: string;
  onEventCreated: (event: PlannerEvent) => void;
}

export function DayPopup({ dateKey, events, onClose, userId, onEventCreated }: DayPopupProps) {
  const [adding, setAdding] = useState(false);

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
      <EventList events={events} />

      {adding ? (
        <div className="mt-3 pt-3 border-t-2 border-pixel-border">
          <EventForm
            userId={userId}
            dateKey={dateKey}
            visibility="month"
            onCreated={(event) => {
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
    </PixelModal>
  );
}
