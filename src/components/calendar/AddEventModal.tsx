"use client";

import { PixelModal } from "@/components/ui/PixelModal";
import { EventForm } from "@/components/calendar/EventForm";
import type { EventVisibility, PlannerEvent } from "@/types/event";

interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  dateKey: string;
  visibility: EventVisibility;
  onCreated: (event: PlannerEvent) => void;
}

export function AddEventModal({ open, onClose, userId, dateKey, visibility, onCreated }: AddEventModalProps) {
  if (!open) return null;

  return (
    <PixelModal open={open} onClose={onClose} title={`${dateKey} 일정 추가`} emoji="✏️">
      <EventForm
        userId={userId}
        dateKey={dateKey}
        visibility={visibility}
        onSaved={(event) => {
          onCreated(event);
          onClose();
        }}
      />
    </PixelModal>
  );
}
