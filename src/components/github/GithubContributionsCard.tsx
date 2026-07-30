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

interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0~4
}

interface ContributionsResponse {
  total: { lastYear: number };
  contributions: ContributionDay[];
}

const LEVELS = [0, 1, 2, 3, 4];

// 데이터 배열(최근 1년, 일자순)을 일요일 시작 7일짜리 주 단위 열로 나눔. 첫 날이 일요일이 아니면
// 그만큼 빈 칸으로 앞을 채워 요일이 항상 같은 행에 오도록 맞춤.
function buildWeeks(days: ContributionDay[]): (ContributionDay | null)[][] {
  if (days.length === 0) return [];
  const firstDow = new Date(days[0].date).getDay();
  const padded: (ContributionDay | null)[] = [...Array(firstDow).fill(null), ...days];
  const weeks: (ContributionDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

// 그 주에 어떤 달의 1일이 포함되어 있으면 그 달을 라벨로 반환(달이 바뀌는 주에만 라벨이 붙음)
function weekMonthLabel(week: (ContributionDay | null)[]): string | null {
  for (const day of week) {
    if (!day) continue;
    const date = new Date(day.date);
    if (date.getDate() === 1) return `${date.getMonth() + 1}월`;
  }
  return null;
}

export function GithubContributionsCard({ userId, onConnectClick }: GithubContributionsCardProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [loadingUsername, setLoadingUsername] = useState(true);
  const [data, setData] = useState<ContributionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 지금 data/error가 어떤 아이디에 대한 결과인지 추적 — username이 바뀌면 그 값을 아직 못 따라잡은
  // 동안만 "불러오는 중"으로 표시함 (effect 안에서 setState를 곧바로 부르지 않기 위한 파생 상태)
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    fetchUserSettings(supabase, userId).then((settings) => {
      if (!active) return;
      setUsername(settings?.github_username || null);
      setLoadingUsername(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!username) return;
    let active = true;

    fetch(`/api/github-contributions?username=${encodeURIComponent(username)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(json?.error ?? "GitHub 잔디를 불러오지 못했어요.");
          setData(null);
        } else {
          setData(json as ContributionsResponse);
          setError(null);
        }
        setFetchedFor(username);
      })
      .catch(() => {
        if (!active) return;
        setError("GitHub 잔디를 불러오지 못했어요.");
        setData(null);
        setFetchedFor(username);
      });

    return () => {
      active = false;
    };
  }, [username]);

  const loadingData = username !== null && fetchedFor !== username;

  if (loadingUsername) {
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

  const weeks = data ? buildWeeks(data.contributions) : [];
  const totalLastYear = data?.total.lastYear ?? 0;

  return (
    <PixelCard heading="🌱 GitHub 잔디" tone="mint">
      {loadingData && <p className="font-body text-sm text-pixel-ink-soft">불러오는 중...</p>}

      {error && !loadingData && (
        <p className="font-body text-sm text-pixel-red">{error}</p>
      )}

      {data && !loadingData && !error && (
        <>
          <p className="font-body text-sm text-pixel-ink-soft mb-2">
            최근 1년간 <span className="font-bold text-pixel-ink">{totalLastYear}</span>회 커밋
          </p>

          <div className="overflow-x-auto pb-1">
            <div className="inline-flex flex-col gap-1 min-w-max">
              <div className="flex gap-[3px] pl-[1px]">
                {weeks.map((week, i) => (
                  <div key={i} className="w-[11px] shrink-0 font-body text-[10px] text-pixel-ink-soft">
                    {weekMonthLabel(week) ?? ""}
                  </div>
                ))}
              </div>
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px] shrink-0">
                    {Array.from({ length: 7 }).map((_, di) => {
                      const day = week[di];
                      if (!day) return <div key={di} className="w-[11px] h-[11px]" />;
                      return (
                        <div
                          key={day.date}
                          title={`${day.date} · ${day.count}회 커밋`}
                          className="w-[11px] h-[11px] rounded-[3px]"
                          style={{ backgroundColor: `var(--contrib-${day.level})` }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-2">
            <span className="font-body text-[11px] text-pixel-ink-soft">적음</span>
            {LEVELS.map((level) => (
              <span
                key={level}
                className="w-[11px] h-[11px] rounded-[3px] shrink-0"
                style={{ backgroundColor: `var(--contrib-${level})` }}
              />
            ))}
            <span className="font-body text-[11px] text-pixel-ink-soft">많음</span>
          </div>
        </>
      )}

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
