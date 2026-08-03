"use client";

import { useState } from "react";
import type { VocabWord } from "@/types/vocab";

interface FlipCardProps {
  word: VocabWord;
  onToggleStarred?: (word: VocabWord) => void;
  onToggleTriangled?: (word: VocabWord) => void;
}

export function FlipCard({ word, onToggleStarred, onToggleTriangled }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  // 두 면(front/back) 모두 [backface-visibility:hidden]으로 반대쪽을 뒤집었을 때 "안 보이게"는
  // 되지만, 실제로 확인해보니(Playwright로 elementFromPoint 테스트) 뒤집힌 상태에서도 안 보이는
  // 면의 ★/▲ 버튼이 여전히 클릭을 가로챔 — 게다가 front 면은 자기 자신의 상쇄 회전이 없어서
  // 뒤집혔을 때 좌우가 미러링된 채로 남아있어, 화면엔 뒤(back)의 ★/▲가 제자리에 보이는데 실제
  // 클릭은 그 뒤에 숨어있던 front의 ▲/★(좌우가 바뀐 위치)가 받아버림 — 이게 "카드를 뒤집으면
  // 별/세모 클릭이 반대로 되는" 증상의 원인. backface-visibility만으로는 클릭까지 막아주지
  // 않으므로, 지금 보이지 않는 쪽 면에 pointer-events-none을 명시적으로 줘서 막음.

  return (
    <div
      className="relative h-36 [perspective:1000px] cursor-pointer select-none"
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div
          className={`absolute inset-0 [backface-visibility:hidden] border-2 border-pixel-border rounded-[14px] flex items-center justify-center p-3 text-center shadow-[var(--pixel-shadow)] text-pixel-chip-ink ${
            flipped ? "pointer-events-none" : ""
          } ${
            word.is_starred
              ? "bg-gradient-to-b from-[#ffedb0] to-pixel-yellow"
              : word.is_triangled
                ? "bg-gradient-to-b from-[#cdf5e0] to-pixel-mint"
                : "bg-gradient-to-b from-white to-pixel-panel"
          }`}
        >
          <p className="font-cute text-xl break-words">{word.term}</p>
          {onToggleStarred && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStarred(word);
              }}
              aria-label="별표 (어려운 단어)"
              title="별표 (어려운 단어)"
              className={`absolute top-1.5 left-1.5 z-20 font-cute text-xs font-bold min-w-[26px] min-h-[26px] flex items-center justify-center border-2 border-pixel-border rounded-full shadow-[var(--pixel-shadow-sm)] active:scale-95 transition-transform cursor-pointer ${
                word.is_starred ? "bg-pixel-yellow text-pixel-chip-ink" : "bg-pixel-panel text-pixel-ink"
              }`}
            >
              ★
            </button>
          )}
          {onToggleTriangled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleTriangled(word);
              }}
              aria-label="세모 (이제 잘 아는 단어)"
              title="세모 (이제 잘 아는 단어)"
              className={`absolute top-1.5 right-1.5 z-20 font-cute text-xs font-bold min-w-[26px] min-h-[26px] flex items-center justify-center border-2 border-pixel-border rounded-full shadow-[var(--pixel-shadow-sm)] active:scale-95 transition-transform cursor-pointer ${
                word.is_triangled ? "bg-pixel-mint text-pixel-chip-ink" : "bg-pixel-panel text-pixel-ink"
              }`}
            >
              ▲
            </button>
          )}
        </div>

        <div
          className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] border-2 border-pixel-border rounded-[14px] flex items-center justify-center p-3 text-center bg-gradient-to-b from-[#cdf5e0] to-pixel-mint shadow-[var(--pixel-shadow)] text-pixel-chip-ink ${
            flipped ? "" : "pointer-events-none"
          }`}
        >
          <p className="font-body text-base break-words">{word.meaning}</p>
          {onToggleStarred && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStarred(word);
              }}
              aria-label="별표 (어려운 단어)"
              title="별표 (어려운 단어)"
              className={`absolute top-1.5 left-1.5 z-20 font-cute text-xs font-bold min-w-[26px] min-h-[26px] flex items-center justify-center border-2 border-pixel-border rounded-full shadow-[var(--pixel-shadow-sm)] active:scale-95 transition-transform cursor-pointer ${
                word.is_starred ? "bg-pixel-yellow text-pixel-chip-ink" : "bg-pixel-panel text-pixel-ink"
              }`}
            >
              ★
            </button>
          )}
          {onToggleTriangled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleTriangled(word);
              }}
              aria-label="세모 (이제 잘 아는 단어)"
              title="세모 (이제 잘 아는 단어)"
              className={`absolute top-1.5 right-1.5 z-20 font-cute text-xs font-bold min-w-[26px] min-h-[26px] flex items-center justify-center border-2 border-pixel-border rounded-full shadow-[var(--pixel-shadow-sm)] active:scale-95 transition-transform cursor-pointer ${
                word.is_triangled ? "bg-pixel-mint text-pixel-chip-ink" : "bg-pixel-panel text-pixel-ink"
              }`}
            >
              ▲
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
