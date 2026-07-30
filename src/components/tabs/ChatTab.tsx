"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import type { PlannerEvent } from "@/types/event";

interface ChatTabProps {
  onEventCreated: (event: PlannerEvent) => void;
}

export function ChatTab({ onEventCreated }: ChatTabProps) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div>
        <h1 className="font-cute text-3xl font-bold">채팅창</h1>
        <p className="font-body text-sm text-pixel-ink-soft">💬 채팅으로 일정을 편하게 등록해요</p>
      </div>

      <ChatPanel onEventCreated={onEventCreated} />
    </div>
  );
}
