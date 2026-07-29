"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA 캐싱은 부가 기능이라 실패해도 앱 동작에는 영향 없음
      });
    }
  }, []);

  return null;
}
