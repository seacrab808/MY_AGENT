"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchUserSettings } from "@/lib/settings";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";

interface GithubContributionsCardProps {
  userId: string;
  onConnectClick: () => void;
}

export function GithubContributionsCard({ userId, onConnectClick }: GithubContributionsCardProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    fetchUserSettings(supabase, userId).then((settings) => {
      if (!active) return;
      setUsername(settings?.github_username || null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <PixelCard heading="🌱 GitHub 잔디" tone="mint">
        <p className="font-body text-sm text-pixel-ink-soft">불러오는 중...</p>
      </PixelCard>
    );
  }

  if (!username) {
    return (
      <PixelCard heading="🌱 GitHub 잔디" tone="mint">
        <p className="font-body text-sm text-pixel-ink-soft mb-3">
          아직 GitHub 계정이 연동되지 않았어요. GitHub 아이디를 연동하면 여기에 커밋 잔디가
          표시돼요.
        </p>
        <PixelButton type="button" tone="mint" onClick={onConnectClick}>
          GitHub 연동하기 →
        </PixelButton>
      </PixelCard>
    );
  }

  return (
    <PixelCard heading="🌱 GitHub 잔디" tone="mint">
      <div className="overflow-x-auto">
        {/* eslint-disable-next-line @next/next/no-img-element -- 외부 서비스(ghchart)가 생성하는 SVG, next/image 최적화 대상 아님 */}
        <img
          src={`https://ghchart.rshah.org/${username}`}
          alt={`${username}의 GitHub 잔디(커밋 기록)`}
          className="min-w-[600px] w-full"
        />
      </div>
      <a
        href={`https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body text-xs text-pixel-ink-soft hover:underline mt-2 inline-block"
      >
        @{username} 프로필 보기 →
      </a>
    </PixelCard>
  );
}
