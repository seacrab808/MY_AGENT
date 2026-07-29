"use client";

import { useState } from "react";
import type { VocabWord } from "@/types/vocab";
import { FlipCard } from "@/components/vocab/FlipCard";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";

interface VocabQuizProps {
  words: VocabWord[];
  onToggleDifficult: (word: VocabWord) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const COUNT_OPTIONS = [5, 10, 15, 20];

export function VocabQuiz({ words, onToggleDifficult }: VocabQuizProps) {
  const [count, setCount] = useState(Math.min(10, words.length || 5));
  const [deck, setDeck] = useState<VocabWord[] | null>(null);

  function startQuiz() {
    setDeck(shuffle(words).slice(0, count));
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
    return (
      <PixelCard>
        <h2 className="font-cute text-2xl mb-3">🎲 퀴즈 시작하기</h2>
        <p className="font-body text-sm text-pixel-ink-soft mb-3">
          등록된 단어 {words.length}개 중 몇 개로 퀴즈를 풀어볼까요?
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {COUNT_OPTIONS.filter((n) => n <= words.length).map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`font-cute text-lg px-3 py-1.5 border-[3px] border-pixel-border rounded-[8px] cursor-pointer transition-transform ${
                count === n
                  ? "bg-gradient-to-b from-[#b7cfff] to-pixel-blue shadow-[var(--pixel-bevel-active)]"
                  : "bg-pixel-panel shadow-[var(--pixel-bevel)] hover:-translate-y-0.5"
              }`}
            >
              {n}개
            </button>
          ))}
          <button
            onClick={() => setCount(words.length)}
            className={`font-cute text-lg px-3 py-1.5 border-[3px] border-pixel-border rounded-[8px] cursor-pointer transition-transform ${
              count === words.length
                ? "bg-gradient-to-b from-[#b7cfff] to-pixel-blue shadow-[var(--pixel-bevel-active)]"
                : "bg-pixel-panel shadow-[var(--pixel-bevel)] hover:-translate-y-0.5"
            }`}
          >
            전체 ({words.length}개)
          </button>
        </div>
        <PixelButton tone="purple" onClick={startQuiz}>
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
          <PixelButton tone="yellow" className="text-sm px-3 py-1.5" onClick={() => setDeck(shuffle(words).slice(0, count))}>
            다시 섞기
          </PixelButton>
          <PixelButton tone="ink" className="text-sm px-3 py-1.5" onClick={() => setDeck(null)}>
            설정으로
          </PixelButton>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {deck.map((word) => (
          <FlipCard key={word.id} word={word} onToggleDifficult={onToggleDifficult} />
        ))}
      </div>
    </PixelCard>
  );
}
