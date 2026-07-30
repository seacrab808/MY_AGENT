"use client";

import { TABS, type TabKey } from "@/lib/tabs";
import { PixelButton } from "@/components/ui/PixelButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { logout } from "@/app/actions";

interface SidebarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  displayName: string | null;
  greeting: string;
}

export function Sidebar({ active, onChange, displayName, greeting }: SidebarProps) {
  const nameLabel = displayName?.trim() || "사용자";

  return (
    <div className="w-full md:w-60 shrink-0 flex flex-col gap-3">
      {/* 프로필 카드 — 예전엔 상단 배너에 있던 자리, 이제 사이드바 맨 위로 옮김 */}
      <div className="bg-pixel-panel border-2 border-pixel-border rounded-[18px] shadow-[var(--pixel-shadow)] p-3 flex items-center gap-2.5">
        <span
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pixel-pink to-pixel-purple text-xl shrink-0"
          aria-hidden
        >
          🐰
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-cute text-base font-bold truncate">{nameLabel}의 플래너</p>
          <p className="font-body text-[11px] text-pixel-ink-soft truncate">🌱 PIXEL PLANNER</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="relative">
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {TABS.map((tab) => {
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className={`flex items-center gap-2.5 font-cute text-lg pl-2 pr-3 py-2 border-2 border-pixel-border rounded-[14px] whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                  isActive
                    ? "bg-gradient-to-b from-[#f6dcee] to-pixel-pink shadow-[var(--pixel-bevel-active)] text-pixel-chip-ink"
                    : "bg-pixel-panel shadow-[var(--pixel-shadow-sm)] hover:-translate-y-0.5"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-[10px] border-2 border-pixel-border text-base ${
                    isActive ? "bg-pixel-panel" : "bg-pixel-bg"
                  }`}
                >
                  {tab.emoji}
                </span>
                {tab.label}
              </button>
            );
          })}
        </nav>
        {/* fade hint that more tabs are scrollable off-screen — mobile only */}
        <div className="pointer-events-none absolute top-0 right-0 bottom-2 w-8 bg-gradient-to-l from-pixel-bg to-transparent md:hidden" />
      </div>

      {/* 마스코트 카드 — 응원 문구 + 로그아웃 (예전엔 상단 배너에 있던 로그아웃을 여기로 옮김) */}
      <div className="flex flex-col items-center gap-2 bg-pixel-panel border-2 border-pixel-border rounded-[18px] shadow-[var(--pixel-shadow)] p-3">
        <span className="text-2xl" aria-hidden>
          🐰 🐻
        </span>
        <p className="font-cute text-xs text-center text-pixel-ink-soft leading-snug">{greeting}</p>
        <form action={logout} className="w-full">
          <PixelButton type="submit" tone="ink" className="w-full text-sm px-3 py-1.5">
            로그아웃
          </PixelButton>
        </form>
      </div>
    </div>
  );
}
