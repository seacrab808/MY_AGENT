"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VocabGroup, VocabWord } from "@/types/vocab";
import { VocabWordManager } from "@/components/vocab/VocabWordManager";
import { VocabQuiz } from "@/components/vocab/VocabQuiz";

interface VocabQuizTabProps {
  userId: string;
}

type SubView = "manage" | "quiz";

export function VocabQuizTab({ userId }: VocabQuizTabProps) {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [groups, setGroups] = useState<VocabGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<SubView>("manage");

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("vocab_groups").select("*").order("created_at", { ascending: true }),
      supabase.from("vocab_words").select("*").order("created_at", { ascending: true }),
    ]).then(([groupsRes, wordsRes]) => {
      if (!groupsRes.error) setGroups((groupsRes.data ?? []) as VocabGroup[]);
      if (!wordsRes.error) setWords((wordsRes.data ?? []) as VocabWord[]);
      setLoading(false);
    });
  }, []);

  async function handleAdd(term: string, meaning: string, groupId: string | null) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vocab_words")
      .insert({ user_id: userId, term, meaning, group_id: groupId })
      .select()
      .single();
    if (!error && data) setWords((prev) => [...prev, data as VocabWord]);
  }

  async function handleRemove(word: VocabWord) {
    setWords((prev) => prev.filter((w) => w.id !== word.id));
    const supabase = createClient();
    await supabase.from("vocab_words").delete().eq("id", word.id);
  }

  async function handleToggleStarred(word: VocabWord) {
    setWords((prev) =>
      prev.map((w) => (w.id === word.id ? { ...w, is_starred: !w.is_starred } : w)),
    );
    const supabase = createClient();
    await supabase.from("vocab_words").update({ is_starred: !word.is_starred }).eq("id", word.id);
  }

  async function handleToggleTriangled(word: VocabWord) {
    setWords((prev) =>
      prev.map((w) => (w.id === word.id ? { ...w, is_triangled: !w.is_triangled } : w)),
    );
    const supabase = createClient();
    await supabase.from("vocab_words").update({ is_triangled: !word.is_triangled }).eq("id", word.id);
  }

  async function handleCreateGroup(name: string): Promise<VocabGroup | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vocab_groups")
      .insert({ user_id: userId, name })
      .select()
      .single();
    if (error || !data) return null;
    const group = data as VocabGroup;
    setGroups((prev) => [...prev, group]);
    return group;
  }

  async function handleRenameGroup(groupId: string, name: string) {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name } : g)));
    const supabase = createClient();
    await supabase.from("vocab_groups").update({ name }).eq("id", groupId);
  }

  async function handleDeleteGroup(groupId: string) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setWords((prev) => prev.map((w) => (w.group_id === groupId ? { ...w, group_id: null } : w)));
    const supabase = createClient();
    await supabase.from("vocab_groups").delete().eq("id", groupId);
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
          groups={groups}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onToggleStarred={handleToggleStarred}
          onToggleTriangled={handleToggleTriangled}
          onCreateGroup={handleCreateGroup}
          onRenameGroup={handleRenameGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      ) : (
        <VocabQuiz
          words={words}
          groups={groups}
          onToggleStarred={handleToggleStarred}
          onToggleTriangled={handleToggleTriangled}
        />
      )}
    </div>
  );
}
