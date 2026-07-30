"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Todo, TodoScope } from "@/types/todo";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCheckbox } from "@/components/ui/PixelCheckbox";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface TodoListProps {
  userId: string;
  scope: TodoScope;
  periodKey: string;
  emptyLabel?: string;
  /** 진행률 바 표시 여부 (오늘의 TODO / 이달의 TODO에서 켜짐, 분기·연간 TODO는 기본 꺼짐) */
  showProgress?: boolean;
}

export function TodoList({ userId, scope, periodKey, emptyLabel, showProgress = false }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("todos")
      .select("*")
      .eq("scope", scope)
      .eq("period_key", periodKey)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error) setTodos((data ?? []) as Todo[]);
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
      .from("todos")
      .insert({ user_id: userId, scope, period_key: periodKey, title })
      .select()
      .single();

    if (!error && data) {
      setTodos((prev) => [...prev, data as Todo]);
    }
  }

  async function toggleDone(todo: Todo) {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, is_done: !t.is_done } : t)),
    );
    const supabase = createClient();
    await supabase.from("todos").update({ is_done: !todo.is_done }).eq("id", todo.id);
  }

  async function remove(todo: Todo) {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    const supabase = createClient();
    await supabase.from("todos").delete().eq("id", todo.id);
  }

  const doneCount = todos.filter((t) => t.is_done).length;

  return (
    <div className="flex flex-col gap-2">
      {showProgress && !loading && <ProgressBar done={doneCount} total={todos.length} />}

      <form onSubmit={handleAdd} className="flex gap-2">
        <PixelInput
          className="flex-1"
          placeholder="할 일을 입력해줘"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <PixelButton type="submit" tone="mint" className="text-sm px-3">
          추가
        </PixelButton>
      </form>

      {loading ? (
        <p className="font-body text-sm text-pixel-ink-soft py-2">불러오는 중...</p>
      ) : todos.length === 0 ? (
        <p className="font-body text-sm text-pixel-ink-soft py-2">
          {emptyLabel ?? "아직 할 일이 없어요."}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2 border-2 border-pixel-border rounded-[10px] px-2.5 py-1.5 bg-pixel-bg"
            >
              <PixelCheckbox checked={todo.is_done} onChange={() => toggleDone(todo)} tone="blue" />
              <span
                className={`flex-1 min-w-0 font-body text-sm break-words ${
                  todo.is_done ? "line-through text-pixel-ink-soft" : ""
                }`}
              >
                {todo.title}
              </span>
              <button
                onClick={() => remove(todo)}
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
