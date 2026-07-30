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
          className={`absolute inset-0 [backface-visibility:hidden] border-[3px] border-pixel-border rounded-[14px] flex items-center justify-center p-3 text-center shadow-[var(--pixel-bevel)] text-pixel-chip-ink ${
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
              className={`absolute top-1.5 left-1.5 z-20 font-pixel text-[10px] px-1.5 py-1 border-2 border-pixel-border rounded-[6px] cursor-pointer ${
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
              className={`absolute top-1.5 right-1.5 z-20 font-pixel text-[10px] px-1.5 py-1 border-2 border-pixel-border rounded-[6px] cursor-pointer ${
                word.is_triangled ? "bg-pixel-mint text-pixel-chip-ink" : "bg-pixel-panel text-pixel-ink"
              }`}
            >
              ▲
            </button>
          )}
        </div>

        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] border-[3px] border-pixel-border rounded-[14px] flex items-center justify-center p-3 text-center bg-gradient-to-b from-[#cdf5e0] to-pixel-mint shadow-[var(--pixel-bevel)] text-pixel-chip-ink">
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
              className={`absolute top-1.5 left-1.5 z-20 font-pixel text-[10px] px-1.5 py-1 border-2 border-pixel-border rounded-[6px] cursor-pointer ${
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
              className={`absolute top-1.5 right-1.5 z-20 font-pixel text-[10px] px-1.5 py-1 border-2 border-pixel-border rounded-[6px] cursor-pointer ${
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
