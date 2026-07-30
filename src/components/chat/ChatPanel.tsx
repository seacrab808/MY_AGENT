"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import type { PlannerEvent } from "@/types/event";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

// 상대(AI 일정 비서) 말풍선 옆에 붙는 프로필 아이콘. 제미나이 아이콘처럼 파랑→보라→핑크
// 그라데이션 원 위에 반짝이(✦) 하나 — 실제 로고를 쓸 수 없으니 같은 톤의 느낌만 근사.
function AssistantAvatar() {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-white text-xs shadow-[var(--pixel-shadow-sm)]"
      style={{ background: "linear-gradient(135deg, #4f9cf6 0%, #a86ef0 55%, #f97ec2 100%)" }}
    >
      ✦
    </span>
  );
}

interface ChatPanelProps {
  onEventCreated: (event: PlannerEvent) => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "안녕! 나는 너의 일정 비서야. \"8월 5일 15시에 논문 미팅\" 처럼 말해주면 캘린더에 등록해줄게 📌",
};

const CHAT_HISTORY_STORAGE_KEY = "planner_chat_history_v1";
const CHAT_HISTORY_TTL_MS = 24 * 60 * 60 * 1000; // 하루 동안 대화 내용 보관

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [WELCOME_MESSAGE];
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw) as { messages: ChatMessage[]; savedAt: number };
    if (
      !parsed ||
      !Array.isArray(parsed.messages) ||
      Date.now() - parsed.savedAt > CHAT_HISTORY_TTL_MS
    ) {
      window.localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
      return [WELCOME_MESSAGE];
    }
    return parsed.messages.length > 0 ? parsed.messages : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

export function ChatPanel({ onEventCreated }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredMessages());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CHAT_HISTORY_STORAGE_KEY,
        JSON.stringify({ messages, savedAt: Date.now() })
      );
    } catch {
      // localStorage 사용 불가(프라이버시 모드 등)한 경우 조용히 무시
    }
  }, [messages]);

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
    <PixelCard className="flex flex-col min-h-[calc(100vh-220px)]">
      <h2 className="font-cute text-2xl mb-2 flex items-center gap-2">💬 일정 채팅</h2>
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1 mb-3">
        {messages.map((m) =>
          m.role === "assistant" ? (
            <div key={m.id} className="flex items-start gap-2 max-w-[85%] lg:max-w-[640px] self-start">
              <AssistantAvatar />
              <div className="font-body text-sm rounded-[10px] px-3 py-2 border-2 border-pixel-border bg-pixel-bg whitespace-pre-wrap break-words min-w-0">
                {m.text}
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              className="font-body text-sm rounded-[10px] px-3 py-2 border-2 border-pixel-border max-w-[85%] lg:max-w-[640px] whitespace-pre-wrap break-words bg-pixel-blue text-pixel-chip-ink self-end"
            >
              {m.text}
            </div>
          ),
        )}
        {loading && (
          <div className="flex items-start gap-2 self-start">
            <AssistantAvatar />
            <div className="font-body text-sm text-pixel-ink-soft px-3 py-2">생각 중...</div>
          </div>
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
