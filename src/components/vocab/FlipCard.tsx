"use client";

import { useState } from "react";
import type { VocabWord } from "@/types/vocab";

interface FlipCardProps {
  word: VocabWord;
  onToggleDifficult?: (word: VocabWord) => void;
}

export function FlipCard({ word, onToggleDifficult }: FlipCardProps) {
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
            word.is_difficult
              ? "bg-gradient-to-b from-[#ffedb0] to-pixel-yellow"
              : "bg-gradient-to-b from-white to-pixel-panel text-pixel-chip-ink"
          }`}
        >
          <p className="font-cute text-xl break-words">{word.term}</p>
        </div>

        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] border-[3px] border-pixel-border rounded-[14px] flex items-center justify-center p-3 text-center bg-gradient-to-b from-[#cdf5e0] to-pixel-mint shadow-[var(--pixel-bevel)] text-pixel-chip-ink">
          <p className="font-body text-base break-words">{word.meaning}</p>
        </div>
      </div>

      {onToggleDifficult && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDifficult(word);
          }}
          aria-label="어려운 단어 표시"
          title="어려운 단어로 표시"
          className={`absolute top-1.5 right-1.5 z-10 font-pixel text-[10px] px-1.5 py-1 border-2 border-pixel-border rounded-[6px] cursor-pointer ${
            word.is_difficult ? "bg-pixel-red text-pixel-bg" : "bg-pixel-panel"
          }`}
        >
          ✎
        </button>
      )}
    </div>
  );
}
