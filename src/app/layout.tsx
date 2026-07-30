import type { Metadata, Viewport } from "next";
import { Press_Start_2P, Gaegu } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

// 귀여운 손글씨 폰트 하나로 font-cute/font-body를 모두 통일 (globals.css 참고)
const gaegu = Gaegu({
  variable: "--font-gaegu",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "픽셀 플래너",
  description: "석사생을 위한 나만의 하루/일주일 루틴 플래너 에이전트",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c9ef5",
  width: "device-width",
  initialScale: 1,
};

// 페이지가 그려지기 전에(hydration 전) 저장된 테마를 <html>에 미리 붙여서 라이트→다크 깜빡임을
// 막는 블로킹 스크립트. 저장된 값이 없으면 그때만 시스템(OS) 설정을 1회 참고함.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("planner-theme");
    var isDark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pressStart.variable} ${gaegu.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* relative + z-index: 다크 모드의 고정(fixed) 별빛 배경(body::after) 위로 실제 콘텐츠가 올라오게 함 */}
        <div className="relative z-[1] flex flex-col flex-1 min-h-full">{children}</div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
