"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import type { PlannerEvent } from "@/types/event";

interface ChatTabProps {
  onEventCreated: (event: PlannerEvent) => void;
}

export function ChatTab({ onEventCreated }: ChatTabProps) {
  return (
    <div className="max-w-2xl">
      <ChatPanel onEventCreated={onEventCreated} />
    </div>
  );
}
