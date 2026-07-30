"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VocabWord } from "@/types/vocab";
import { VocabWordManager } from "@/components/vocab/VocabWordManager";
import { VocabQuiz } from "@/components/vocab/VocabQuiz";

interface VocabQuizTabProps {
  userId: string;
}

type SubView = "manage" | "quiz";

export function VocabQuizTab({ userId }: VocabQuizTabProps) {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<SubView>("manage");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("vocab_words")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error) setWords((data ?? []) as VocabWord[]);
        setLoading(false);
      });
  }, []);

  async function handleAdd(term: string, meaning: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vocab_words")
      .insert({ user_id: userId, term, meaning })
      .select()
      .single();
    if (!error && data) setWords((prev) => [...prev, data as VocabWord]);
  }

  async function handleRemove(word: VocabWord) {
    setWords((prev) => prev.filter((w) => w.id !== word.id));
    const supabase = createClient();
    await supabase.from("vocab_words").delete().eq("id", word.id);
  }

  async function handleToggleDifficult(word: VocabWord) {
    setWords((prev) =>
      prev.map((w) => (w.id === word.id ? { ...w, is_difficult: !w.is_difficult } : w)),
    );
    const supabase = createClient();
    await supabase.from("vocab_words").update({ is_difficult: !word.is_difficult }).eq("id", word.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => setView("manage")}
          className={`font-cute text-lg px-4 py-2 border-[3px] border-pixel-border rounded-[10px] cursor-pointer transition-transform ${
            view === "manage"
              ? "bg-gradient-to-b from-[#cdf5e0] to-pixel-mint shadow-[var(--pixel-bevel-active)] text-pixel-chip-ink"
              : "bg-pixel-panel shadow-[var(--pixel-bevel)] hover:-translate-y-0.5"
          }`}
        >
          단어 추가
        </button>
        <button
          onClick={() => setView("quiz")}
          className={`font-cute text-lg px-4 py-2 border-[3px] border-pixel-border rounded-[10px] cursor-pointer transition-transform ${
            view === "quiz"
              ? "bg-gradient-to-b from-[#e6d8ff] to-pixel-purple shadow-[var(--pixel-bevel-active)] text-pixel-chip-ink"
              : "bg-pixel-panel shadow-[var(--pixel-bevel)] hover:-translate-y-0.5"
          }`}
        >
          퀴즈 풀기
        </button>
      </div>

      {loading ? (
        <p className="font-body text-sm text-pixel-ink-soft">불러오는 중...</p>
      ) : view === "manage" ? (
        <VocabWordManager
          words={words}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onToggleDifficult={handleToggleDifficult}
        />
      ) : (
        <VocabQuiz words={words} onToggleDifficult={handleToggleDifficult} />
      )}
    </div>
  );
}
