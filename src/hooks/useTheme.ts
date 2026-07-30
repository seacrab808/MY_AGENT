"use client";

import { useCallback, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "planner-theme";

function readCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등)여도 화면 전환 자체는 계속 동작해야 함
  }
}

// 사이드바의 라이트/다크 토글 버튼이 쓰는 훅. 실제 초기값은 layout.tsx에 심어둔 블로킹 스크립트가
// hydration 전에 <html class="dark">를 미리 붙여줘서 결정하고, 여긴 그 결과를 (렌더 중에, effect가
// 아니라 lazy useState initializer로) 읽어서 동기화만 함 — 서버 렌더 결과("light" 고정)와 실제 값이
// 다를 수 있어서 그 값이 쓰이는 곳은 suppressHydrationWarning으로 처리함(ThemeToggle.tsx 참고).
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readCurrentTheme);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
