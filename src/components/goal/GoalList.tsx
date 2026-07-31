"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Goal, GoalScope } from "@/types/todo";
import { sortByCompletion } from "@/lib/checklist";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCheckbox } from "@/components/ui/PixelCheckbox";

interface GoalListProps {
  userId: string;
  scope: GoalScope;
  periodKey: string;
}

export function GoalList({ userId, scope, periodKey }: GoalListProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("goals")
      .select("*")
      .eq("scope", scope)
      .eq("period_key", periodKey)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error) setGoals((data ?? []) as Goal[]);
        setLoading(false);
      });
  }, [scope, periodKey]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const title = input.trim();
    if (!title) return;
    setInput("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("goals")
      .insert({ user_id: userId, scope, period_key: periodKey, title })
      .select()
      .single();

    if (!error && data) {
      setGoals((prev) => [...prev, data as Goal]);
    }
  }

  async function toggleDone(goal: Goal) {
    const nextDone = !goal.is_done;
    const completedAt = nextDone ? new Date().toISOString() : null;
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, is_done: nextDone, completed_at: completedAt } : g)),
    );
    const supabase = createClient();
    await supabase.from("goals").update({ is_done: nextDone, completed_at: completedAt }).eq("id", goal.id);
  }

  async function remove(goal: Goal) {
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    const supabase = createClient();
    await supabase.from("goals").delete().eq("id", goal.id);
  }

  const sortedGoals = sortByCompletion(goals);

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleAdd} className="flex gap-2">
        <PixelInput
          className="flex-1"
          placeholder="목표를 입력해줘"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <PixelButton type="submit" tone="purple" className="text-sm px-3">
          추가
        </PixelButton>
      </form>

      {loading ? (
        <p className="font-body text-sm text-pixel-ink-soft py-2">불러오는 중...</p>
      ) : goals.length === 0 ? (
        <p className="font-body text-sm text-pixel-ink-soft py-2">아직 목표가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sortedGoals.map((goal) => (
            <li
              key={goal.id}
              className="flex items-center gap-2 border-2 border-pixel-border rounded-[10px] px-2.5 py-1.5 bg-pixel-bg"
            >
              <PixelCheckbox checked={goal.is_done} onChange={() => toggleDone(goal)} tone="purple" />
              <span
                className={`flex-1 min-w-0 font-body text-sm break-words ${
                  goal.is_done ? "line-through text-pixel-ink-soft" : ""
                }`}
              >
                {goal.title}
              </span>
              <button
                onClick={() => remove(goal)}
                aria-label="삭제"
                className="font-cute text-xs font-bold min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0 border-2 border-pixel-border rounded-full bg-pixel-red text-pixel-bg shadow-[var(--pixel-shadow-sm)] active:scale-95 cursor-pointer transition-transform"
              >
                X
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
