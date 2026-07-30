"use client";

import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
}

// 사이드바 프로필 카드에 들어가는 라이트/다크 전환 버튼
export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      // 실제 초기값은 클라이언트에서만 알 수 있어(레이아웃의 블로킹 스크립트가 <html>에 붙인 클래스를
      // 읽음) 서버 렌더 결과와 다를 수 있음 — 의도된 것이라 hydration 경고를 막아둠
      suppressHydrationWarning
      className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 border-pixel-border bg-pixel-bg text-sm cursor-pointer transition-transform hover:scale-110 ${className}`}
    >
      {isDark ? "🌙" : "🌞"}
    </button>
  );
}
