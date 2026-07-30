"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchUserSettings, saveGithubUsername } from "@/lib/settings";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";

interface AccountTabProps {
  userId: string;
  userEmail: string;
  displayName: string | null;
  onDisplayNameChange: (name: string | null) => void;
}

// 사용자가 아이디, @아이디, 또는 프로필 URL을 붙여넣어도 아이디만 뽑아냄
function normalizeGithubUsername(raw: string): string {
  const trimmed = raw.trim().replace(/^@/, "");
  const match = trimmed.match(/github\.com\/([^/?#]+)/i);
  return (match ? match[1] : trimmed).trim();
}

function DisplayNameCard({ displayName, onDisplayNameChange }: {
  displayName: string | null;
  onDisplayNameChange: (name: string | null) => void;
}) {
  const [name, setName] = useState(displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const trimmed = name.trim();
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ data: { display_name: trimmed || null } });

    setSaving(false);
    if (err) {
      setError(`저장 실패: ${err.message}`);
      return;
    }
    onDisplayNameChange(trimmed || null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <PixelCard>
      <h3 className="font-cute text-xl mb-1">✏️ 이름</h3>
      <p className="font-body text-sm text-pixel-ink-soft mb-3">
        상단 배너의 응원 문구 등에 사용돼요. 비워두면 &quot;사용자님&quot;으로 표시돼요.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <PixelInput
          placeholder="예) 유나"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <PixelButton type="submit" tone="pink" disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </PixelButton>
      </form>
      {saved && <p className="font-cute text-sm text-pixel-ink mt-2">저장했어요! ✏️</p>}
      {error && <p className="font-cute text-sm text-pixel-red mt-2">{error}</p>}
    </PixelCard>
  );
}

type PasswordStep = "idle" | "verify" | "change";

function PasswordChangeCard({ userEmail }: { userEmail: string }) {
  const [step, setStep] = useState<PasswordStep>("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setStep("idle");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    setBusy(false);
    if (err) {
      setError("현재 비밀번호가 맞지 않아요.");
      return;
    }
    setStep("change");
  }

  async function handleChange(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("새 비밀번호는 6자 이상이어야 해요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 서로 달라요.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);

    if (err) {
      setError(`변경 실패: ${err.message}`);
      return;
    }
    reset();
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <PixelCard>
      <h3 className="font-cute text-xl mb-1">🔒 비밀번호 변경</h3>

      {step === "idle" && (
        <PixelButton type="button" tone="blue" onClick={() => setStep("verify")}>
          비밀번호 변경하기
        </PixelButton>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerify} className="flex flex-col gap-2 mt-1">
          <label className="flex flex-col gap-1">
            <span className="font-cute text-sm">현재 비밀번호</span>
            <PixelInput
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
              placeholder="••••••"
            />
          </label>
          <div className="flex gap-2">
            <PixelButton type="submit" tone="blue" disabled={busy}>
              {busy ? "확인 중..." : "확인"}
            </PixelButton>
            <PixelButton type="button" tone="ink" onClick={reset}>
              취소
            </PixelButton>
          </div>
        </form>
      )}

      {step === "change" && (
        <form onSubmit={handleChange} className="flex flex-col gap-2 mt-1">
          <label className="flex flex-col gap-1">
            <span className="font-cute text-sm">새 비밀번호</span>
            <PixelInput
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
              placeholder="••••••"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-cute text-sm">새 비밀번호 확인</span>
            <PixelInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••"
            />
          </label>
          <div className="flex gap-2">
            <PixelButton type="submit" tone="mint" disabled={busy}>
              {busy ? "변경 중..." : "변경하기"}
            </PixelButton>
            <PixelButton type="button" tone="ink" onClick={reset}>
              취소
            </PixelButton>
          </div>
        </form>
      )}

      {done && <p className="font-cute text-sm text-pixel-ink mt-2">비밀번호를 변경했어요! 🔒</p>}
      {error && <p className="font-cute text-sm text-pixel-red mt-2">{error}</p>}
    </PixelCard>
  );
}

function GithubSettingsCard({ userId }: { userId: string }) {
  const [githubUsername, setGithubUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    fetchUserSettings(supabase, userId).then((settings) => {
      setGithubUsername(settings?.github_username ?? "");
      setLoading(false);
    });
  }, [userId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const normalized = normalizeGithubUsername(githubUsername);
    const supabase = createClient();
    const { error: err } = await saveGithubUsername(supabase, userId, normalized || null);

    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setGithubUsername(normalized);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <PixelCard>
      <h3 className="font-cute text-xl mb-1">🌱 GitHub 연동</h3>
      <p className="font-body text-sm text-pixel-ink-soft mb-3">
        GitHub 아이디를 입력하면 월간 캘린더 아래에 그 계정의 커밋 잔디가 표시돼요. 비워두고
        저장하면 연동이 해제돼요.
      </p>

      {loading ? (
        <p className="font-body text-sm text-pixel-ink-soft">불러오는 중...</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <PixelInput
            placeholder="예) octocat"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            className="flex-1"
          />
          <PixelButton type="submit" tone="mint" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </PixelButton>
        </form>
      )}

      {saved && <p className="font-cute text-sm text-pixel-ink mt-2">저장했어요! 🌱</p>}
      {error && <p className="font-cute text-sm text-pixel-red mt-2">{error}</p>}
    </PixelCard>
  );
}

export function AccountTab({ userId, userEmail, displayName, onDisplayNameChange }: AccountTabProps) {
  return (
    <div className="max-w-lg flex flex-col gap-4">
      <div>
        <h1 className="font-cute text-3xl font-bold">내 계정</h1>
        <p className="font-body text-sm text-pixel-ink-soft">👤 {userEmail}</p>
      </div>

      <DisplayNameCard displayName={displayName} onDisplayNameChange={onDisplayNameChange} />
      <PasswordChangeCard userEmail={userEmail} />
      <GithubSettingsCard userId={userId} />
    </div>
  );
}
