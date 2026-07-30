"use client";

import { useActionState, useState } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelInput } from "@/components/ui/PixelInput";
import { HeroBanner } from "@/components/HeroBanner";
import { login, signup, type AuthState } from "./actions";

const initialState: AuthState = {};

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signup, initialState);

  const state = mode === "login" ? loginState : signupState;
  const action = mode === "login" ? loginAction : signupAction;
  const pending = mode === "login" ? loginPending : signupPending;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <HeroBanner title="🌱 PIXEL PLANNER" subtitle="나만의 하루/일주일 루틴 에이전트" />

        <PixelCard>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 font-cute text-lg py-1.5 rounded-[8px] border-[3px] border-pixel-border cursor-pointer transition-transform ${
                mode === "login"
                  ? "bg-gradient-to-b from-[#b7cfff] to-pixel-blue shadow-[var(--pixel-bevel-active)] text-pixel-chip-ink"
                  : "bg-pixel-panel shadow-[var(--pixel-bevel)] hover:-translate-y-0.5"
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 font-cute text-lg py-1.5 rounded-[8px] border-[3px] border-pixel-border cursor-pointer transition-transform ${
                mode === "signup"
                  ? "bg-gradient-to-b from-[#ffd6e6] to-pixel-pink shadow-[var(--pixel-bevel-active)] text-pixel-chip-ink"
                  : "bg-pixel-panel shadow-[var(--pixel-bevel)] hover:-translate-y-0.5"
              }`}
            >
              회원가입
            </button>
          </div>

          <form action={action} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-cute text-sm">이메일</span>
            <PixelInput type="email" name="email" required placeholder="you@example.com" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-cute text-sm">비밀번호</span>
            <PixelInput type="password" name="password" required minLength={6} placeholder="••••••" />
          </label>

          {state?.error && (
            <p className="font-body text-sm text-pixel-red border-2 border-pixel-red rounded-[8px] px-2 py-1.5 bg-pixel-red/10">
              {state.error}
            </p>
          )}

          <PixelButton type="submit" tone={mode === "login" ? "blue" : "pink"} disabled={pending} className="mt-1">
            {pending ? "처리중..." : mode === "login" ? "로그인" : "가입하고 시작하기"}
          </PixelButton>
          </form>
        </PixelCard>
      </div>
    </div>
  );
}
