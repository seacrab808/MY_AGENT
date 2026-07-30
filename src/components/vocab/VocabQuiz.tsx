"use client";

import { useMemo, useState } from "react";
import type { VocabGroup, VocabWord } from "@/types/vocab";
import { FlipCard } from "@/components/vocab/FlipCard";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";

const UNGROUPED = "__ungrouped__";

interface VocabQuizProps {
  words: VocabWord[];
  groups: VocabGroup[];
  onToggleStarred: (word: VocabWord) => void;
  onToggleTriangled: (word: VocabWord) => void;
}

type MarkFilter = "all" | "starred" | "triangled" | "both";

const MARK_FILTER_OPTIONS: { value: MarkFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "starred", label: "★만" },
  { value: "triangled", label: "▲만" },
  { value: "both", label: "★+▲만" },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const COUNT_OPTIONS = [5, 10, 15, 20];

export function VocabQuiz({ words, groups, onToggleStarred, onToggleTriangled }: VocabQuizProps) {
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>(() => [
    UNGROUPED,
    ...groups.map((g) => g.id),
  ]);
  const [markFilter, setMarkFilter] = useState<MarkFilter>("all");
  const [count, setCount] = useState(5);
  const [deck, setDeck] = useState<VocabWord[] | null>(null);

  const pool = useMemo(() => {
    return words
      .filter((w) => selectedGroupKeys.includes(w.group_id ?? UNGROUPED))
      .filter((w) => {
        if (markFilter === "all") return true;
        if (markFilter === "starred") return w.is_starred;
        if (markFilter === "triangled") return w.is_triangled;
        return w.is_starred && w.is_triangled;
      });
  }, [words, selectedGroupKeys, markFilter]);

  function toggleGroupKey(key: string) {
    setSelectedGroupKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function toggleAllGroups() {
    const allKeys = [UNGROUPED, ...groups.map((g) => g.id)];
    setSelectedGroupKeys((prev) => (prev.length === allKeys.length ? [] : allKeys));
  }

  function startQuiz() {
    setDeck(shuffle(pool).slice(0, Math.min(count, pool.length)));
  }

  if (words.length === 0) {
    return (
      <PixelCard>
        <p className="font-body text-sm text-pixel-ink-soft">
          먼저 &apos;단어 추가&apos;에서 단어를 등록해주세요.
        </p>
      </PixelCard>
    );
  }

  if (!deck) {
    const allGroupKeys = [UNGROUPED, ...groups.map((g) => g.id)];
    const countOptions = [...COUNT_OPTIONS.filter((n) => n < pool.length), pool.length].filter(
      (n) => n > 0,
    );

    return (
      <PixelCard>
        <h2 className="font-cute text-2xl mb-3">🎲 퀴즈 시작하기</h2>

        <p className="font-body text-sm text-pixel-ink-soft mb-2">그룹 선택 (복수 선택 가능)</p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={toggleAllGroups}
            className={`font-cute text-sm px-3 py-1.5 border-2 border-pixel-border rounded-[8px] cursor-pointer transition-transform ${
              selectedGroupKeys.length === allGroupKeys.length
                ? "bg-pixel-blue text-pixel-chip-ink"
                : "bg-pixel-panel hover:-translate-y-0.5"
            }`}
          >
            전체
          </button>
          <button
            onClick={() => toggleGroupKey(UNGROUPED)}
            className={`font-cute text-sm px-3 py-1.5 border-2 border-pixel-border rounded-[8px] cursor-pointer transition-transform ${
              selectedGroupKeys.includes(UNGROUPED)
                ? "bg-pixel-blue text-pixel-chip-ink"
                : "bg-pixel-panel hover:-translate-y-0.5"
            }`}
          >
            미분류
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => toggleGroupKey(group.id)}
              className={`font-cute text-sm px-3 py-1.5 border-2 border-pixel-border rounded-[8px] cursor-pointer transition-transform ${
                selectedGroupKeys.includes(group.id)
                  ? "bg-pixel-blue text-pixel-chip-ink"
                  : "bg-pixel-panel hover:-translate-y-0.5"
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>

        <p className="font-body text-sm text-pixel-ink-soft mb-2">표시 필터</p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {MARK_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMarkFilter(opt.value)}
              className={`font-cute text-sm px-3 py-1.5 border-2 border-pixel-border rounded-[8px] cursor-pointer transition-transform ${
                markFilter === opt.value
                  ? "bg-pixel-purple text-pixel-chip-ink"
                  : "bg-pixel-panel hover:-translate-y-0.5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="font-body text-sm text-pixel-ink-soft mb-2">
          선택된 단어 {pool.length}개 중 몇 개로 퀴즈를 풀어볼까요?
        </p>
        {pool.length === 0 ? (
          <p className="font-body text-sm text-pixel-ink-soft mb-4">
            조건에 맞는 단어가 없어요. 그룹/필터를 다시 선택해주세요.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {countOptions.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`font-cute text-lg px-3 py-1.5 border-[3px] border-pixel-border rounded-[8px] cursor-pointer transition-transform ${
                  count === n
                    ? "bg-gradient-to-b from-[#b7cfff] to-pixel-blue shadow-[var(--pixel-bevel-active)] text-pixel-chip-ink"
                    : "bg-pixel-panel shadow-[var(--pixel-bevel)] hover:-translate-y-0.5"
                }`}
              >
                {n === pool.length ? `전체 (${n}개)` : `${n}개`}
              </button>
            ))}
          </div>
        )}
        <PixelButton tone="purple" onClick={startQuiz} disabled={pool.length === 0}>
          퀴즈 생성하기
        </PixelButton>
      </PixelCard>
    );
  }

  return (
    <PixelCard>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-cute text-2xl">🃏 카드를 클릭해서 뜻을 확인해요</h2>
        <div className="flex gap-2">
          <PixelButton
            tone="yellow"
            className="text-sm px-3 py-1.5"
            onClick={() => setDeck(shuffle(pool).slice(0, Math.min(count, pool.length)))}
          >
            다시 섞기
          </PixelButton>
          <PixelButton tone="ink" className="text-sm px-3 py-1.5" onClick={() => setDeck(null)}>
            설정으로
          </PixelButton>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {deck.map((word) => (
          <FlipCard
            key={word.id}
            word={word}
            onToggleStarred={onToggleStarred}
            onToggleTriangled={onToggleTriangled}
          />
        ))}
      </div>
    </PixelCard>
  );
}
