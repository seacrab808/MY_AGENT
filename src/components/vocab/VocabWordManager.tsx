"use client";

import { FormEvent, useState } from "react";
import type { VocabWord } from "@/types/vocab";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";

interface VocabWordManagerProps {
  words: VocabWord[];
  onAdd: (term: string, meaning: string) => void;
  onRemove: (word: VocabWord) => void;
  onToggleDifficult: (word: VocabWord) => void;
}

export function VocabWordManager({ words, onAdd, onRemove, onToggleDifficult }: VocabWordManagerProps) {
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!term.trim() || !meaning.trim()) return;
    onAdd(term.trim(), meaning.trim());
    setTerm("");
    setMeaning("");
  }

  return (
    <PixelCard>
      <h2 className="font-cute text-2xl mb-3">🃏 단어 추가</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <PixelInput
          className="flex-1"
          placeholder="단어 (예: ubiquitous)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <PixelInput
          className="flex-1"
          placeholder="뜻 (예: 도처에 있는)"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
        />
        <PixelButton type="submit" tone="mint" className="text-sm px-4">
          추가
        </PixelButton>
      </form>

      {words.length === 0 ? (
        <p className="font-body text-sm text-pixel-ink-soft py-2">
          아직 등록된 단어가 없어요. 위에서 추가해보세요!
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
          {words.map((word) => (
            <li
              key={word.id}
              className={`flex items-center gap-2 border-2 border-pixel-border rounded-[8px] px-2.5 py-1.5 ${
                word.is_difficult ? "bg-pixel-yellow text-pixel-chip-ink" : "bg-pixel-bg"
              }`}
            >
              <span className="font-cute text-base shrink-0 max-w-[40%] break-words">{word.term}</span>
              <span className="font-body text-sm text-pixel-ink-soft flex-1 min-w-0 break-words">
                {word.meaning}
              </span>
              <button
                onClick={() => onToggleDifficult(word)}
                title="어려운 단어로 표시"
                className={`font-pixel text-[10px] min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 border-2 border-pixel-border rounded-[6px] shadow-[var(--pixel-shadow-sm)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                  word.is_difficult ? "bg-pixel-red text-pixel-bg" : "bg-pixel-panel"
                }`}
              >
                ✎
              </button>
              <button
                onClick={() => onRemove(word)}
                aria-label="삭제"
                className="font-pixel text-[10px] min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 border-2 border-pixel-border rounded-[6px] bg-pixel-red text-pixel-bg shadow-[var(--pixel-shadow-sm)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                X
              </button>
            </li>
          ))}
        </ul>
      )}
    </PixelCard>
  );
}
