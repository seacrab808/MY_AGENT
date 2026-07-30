import { PixelCard } from "@/components/ui/PixelCard";

// 기본값은 이 저장소의 GitHub 계정. 다른 계정 잔디를 보고 싶으면 .env.local에
// NEXT_PUBLIC_GITHUB_USERNAME을 설정하면 됨.
const GITHUB_USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "seacrab808";

export function GithubContributionsCard() {
  return (
    <PixelCard heading="🌱 GitHub 잔디" tone="mint">
      <div className="overflow-x-auto">
        {/* eslint-disable-next-line @next/next/no-img-element -- 외부 서비스(ghchart)가 생성하는 SVG, next/image 최적화 대상 아님 */}
        <img
          src={`https://ghchart.rshah.org/${GITHUB_USERNAME}`}
          alt={`${GITHUB_USERNAME}의 GitHub 잔디(커밋 기록)`}
          className="min-w-[600px] w-full"
        />
      </div>
      <a
        href={`https://github.com/${GITHUB_USERNAME}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body text-xs text-pixel-ink-soft hover:underline mt-2 inline-block"
      >
        @{GITHUB_USERNAME} 프로필 보기 →
      </a>
    </PixelCard>
  );
}
