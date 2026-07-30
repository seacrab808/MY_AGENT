"use client";

import { FormEvent, useRef, useState } from "react";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import type { PlannerEvent } from "@/types/event";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface ChatPanelProps {
  onEventCreated: (event: PlannerEvent) => void;
}

export function ChatPanel({ onEventCreated }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "안녕! 나는 너의 일정 비서야. \"8월 5일 15시에 논문 미팅\" 처럼 말해주면 캘린더에 등록해줄게 📌",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "요청에 실패했어요.");
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: data.reply },
      ]);

      if (data.event) {
        onEventCreated(data.event as PlannerEvent);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: err instanceof Error ? err.message : "오류가 발생했어요.",
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });
    }
  }

  return (
    <PixelCard className="flex flex-col h-full">
      <h2 className="font-cute text-2xl mb-2 flex items-center gap-2">💬 일정 채팅</h2>
      <div ref={listRef} className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 mb-3 min-h-40 max-h-80">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`font-body text-sm rounded-[10px] px-3 py-2 border-2 border-pixel-border max-w-[85%] whitespace-pre-wrap break-words ${
              m.role === "user"
                ? "bg-pixel-blue text-pixel-chip-ink self-end"
                : "bg-pixel-bg self-start"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="font-body text-sm text-pixel-ink-soft self-start px-3">생각 중...</div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <PixelInput
          className="flex-1"
          placeholder="예) 8월 5일 15시에 논문 미팅"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <PixelButton type="submit" tone="mint" disabled={loading || !input.trim()}>
          전송
        </PixelButton>
      </form>
    </PixelCard>
  );
}
