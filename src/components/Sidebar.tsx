"use client";

import { TABS, type TabKey } from "@/lib/tabs";

interface SidebarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <div className="relative w-full md:w-56 shrink-0">
      <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex items-center gap-2.5 font-cute text-lg pl-2 pr-3 py-2 border-[3px] border-pixel-border rounded-[10px] whitespace-nowrap shrink-0 cursor-pointer transition-transform ${
                isActive
                  ? "bg-gradient-to-b from-[#b7cfff] to-pixel-blue shadow-[var(--pixel-bevel-active)] translate-x-[1px] translate-y-[1px] text-pixel-chip-ink"
                  : "bg-pixel-panel shadow-[var(--pixel-bevel)] hover:-translate-y-0.5"
              }`}
            >
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-[6px] border-2 border-pixel-border text-base ${
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
  );
}
