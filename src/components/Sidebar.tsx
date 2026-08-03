"use client";

import { TABS, type TabKey } from "@/lib/tabs";
import { PixelButton } from "@/components/ui/PixelButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { logout } from "@/app/actions";

interface SidebarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  displayName: string | null;
}

// "내 계정"은 일반 nav 목록이 아니라 맨 아래 로그아웃 옆에 따로 둠 — TABS 배열 자체는 그대로 두고
// (다른 곳에서 참조할 수도 있으니) 여기서만 걸러냄.
const ACCOUNT_TAB = TABS.find((tab) => tab.key === "account")!;
const NAV_TABS = TABS.filter((tab) => tab.key !== "account");

function navButtonClass(isActive: boolean) {
  return `flex items-center gap-2.5 font-cute text-lg pl-2 pr-3 py-2 border-2 rounded-[14px] whitespace-nowrap shrink-0 cursor-pointer transition-all ${
    isActive
      ? "border-pixel-purple bg-gradient-to-br from-[var(--sidebar-active-from)] to-[var(--sidebar-active-to)] shadow-[var(--pixel-bevel-active)] text-pixel-ink font-bold"
      : "border-transparent hover:bg-pixel-bg"
  }`;
}

function navIconClass(isActive: boolean) {
  return `flex items-center justify-center w-7 h-7 rounded-[10px] border-2 text-base ${
    isActive
      ? "bg-pixel-panel border-pixel-purple shadow-[0_2px_4px_rgba(120,90,150,0.2)]"
      : "bg-pixel-bg border-pixel-border"
  }`;
}

export function Sidebar({ active, onChange, displayName }: SidebarProps) {
  const nameLabel = displayName?.trim() || "사용자";
  const isAccountActive = active === "account";

  return (
    // 디자인 목업의 .sidebar처럼 프로필/nav/마스코트를 각각 따로 뜬 카드로 두지 않고,
    // 하나의 패널 div 안에 전부 넣고 대시선/여백으로만 구역을 나눔.
    // md 이상에서는 position: sticky 대신 진짜 position: fixed를 씀 — sticky는 "가장 가까운 스크롤
    // 컨테이너"가 무엇인지에 따라 미묘하게 안 먹는 경우가 있는데(overflow-x:hidden이 body/html에
    // 걸려 있어서 실제 스크롤이 어느 쪽에서 일어나는지가 불명확해짐), fixed는 그런 것과 무관하게
    // 무조건 뷰포트 기준으로 고정됨. 대신 fixed는 문서 흐름에서 완전히 빠지므로 원래 flex 레이아웃이
    // 잡아주던 가로 위치(왼쪽에서부터 max-w-7xl mx-auto + p-4만큼 들어간 자리)를 left로 직접 계산해서
    // 맞춰줘야 함 — Dashboard.tsx의 바깥 컨테이너가 정확히 그 수식(max-w-7xl mx-auto p-4)이라
    // left도 똑같은 수식(뷰포트가 좁으면 1rem, 넓으면 가운데 정렬된 여백 + 1rem)으로 따라감.
    // 오른쪽 본문 영역은 Dashboard.tsx에서 sidebar 너비+gap만큼 md:pl-[16rem]으로 비워둠.
    <div className="print:hidden w-full md:w-60 shrink-0 md:fixed md:top-4 md:left-[max(1rem,calc((100vw-80rem)/2+1rem))] md:z-10 md:h-[calc(100vh-2rem)] md:overflow-y-auto md:overflow-x-hidden bg-pixel-panel border-2 border-pixel-border rounded-[24px] shadow-[var(--pixel-shadow)] p-4 flex flex-col gap-3">
      {/* 브랜드: 아바타 + 이름 + 다크모드 토글 */}
      <div className="flex items-center gap-2.5 pb-3 border-b-2 border-dashed border-pixel-border">
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
          {NAV_TABS.map((tab) => {
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className={navButtonClass(isActive)}
              >
                <span className={navIconClass(isActive)}>{tab.emoji}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>
        {/* fade hint that more tabs are scrollable off-screen — mobile only */}
        <div className="pointer-events-none absolute top-0 right-0 bottom-2 w-8 bg-gradient-to-l from-pixel-panel to-transparent md:hidden" />
      </div>

      {/* 내 계정 + 로그아웃: 응원 문구/마스코트 장식은 빼고 계정 관련 동작만 모아서 사이드바
          맨 아래에 고정 (mt-auto로 데스크톱의 고정 높이 안에서 항상 하단에 붙음) */}
      <div className="mt-auto flex flex-col gap-2 pt-3 border-t-2 border-dashed border-pixel-border">
        <button onClick={() => onChange("account")} className={navButtonClass(isAccountActive)}>
          <span className={navIconClass(isAccountActive)}>{ACCOUNT_TAB.emoji}</span>
          {ACCOUNT_TAB.label}
        </button>
        <form action={logout} className="w-full">
          <PixelButton type="submit" tone="ink" className="w-full text-sm px-3 py-1.5">
            로그아웃
          </PixelButton>
        </form>
      </div>
    </div>
  );
}
