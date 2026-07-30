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
}

// 사용자가 아이디, @아이디, 또는 프로필 URL을 붙여넣어도 아이디만 뽑아냄
function normalizeGithubUsername(raw: string): string {
  const trimmed = raw.trim().replace(/^@/, "");
  const match = trimmed.match(/github\.com\/([^/?#]+)/i);
  return (match ? match[1] : trimmed).trim();
}

export function AccountTab({ userId, userEmail }: AccountTabProps) {
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
    <div className="max-w-lg flex flex-col gap-4">
      <PixelCard>
        <h2 className="font-cute text-2xl mb-1">👤 내 계정</h2>
        <p className="font-body text-sm text-pixel-ink-soft">{userEmail}</p>
      </PixelCard>

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
    </div>
  );
}
