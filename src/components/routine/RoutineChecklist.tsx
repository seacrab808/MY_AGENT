"use client";

import { FormEvent, useEffect, useState } from "react";
import { parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { RoutineItem, RoutinePeriod } from "@/types/routine";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";

interface RoutineChecklistProps {
  userId: string;
  period: RoutinePeriod;
  dateKey: string;
  label: string;
  emoji: string;
}

export function RoutineChecklist({ userId, period, dateKey, label, emoji }: RoutineChecklistProps) {
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("routines")
      .select("*")
      .eq("period", period)
      .eq("routine_date", dateKey)
      .order("created_at", { ascending: true })
      .then(async ({ data, error }) => {
        if (!error && data && data.length > 0) {
          setItems(data as RoutineItem[]);
          setLoading(false);
          return;
        }

        // 해당 날짜/시간대에 아직 등록된 루틴이 없다면 요일별 프리셋 자동 생성
        const dow = parseISO(dateKey).getDay();
        const { data: presetData } = await supabase
          .from("routine_presets")
          .select("label")
          .eq("period", period)
          .eq("day_of_week", dow)
          .order("created_at", { ascending: true });

        if (presetData && presetData.length > 0) {
          const newRows = presetData.map((p) => ({
            user_id: userId,
            period,
            routine_date: dateKey,
            label: p.label,
            is_done: false,
          }));

          const { data: insertedData } = await supabase
            .from("routines")
            .insert(newRows)
            .select();

          setItems((insertedData ?? []) as RoutineItem[]);
        } else {
          setItems([]);
        }
        setLoading(false);
      });
  }, [userId, period, dateKey]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    setInput("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("routines")
      .insert({ user_id: userId, period, routine_date: dateKey, label: value })
      .select()
      .single();

    if (!error && data) setItems((prev) => [...prev, data as RoutineItem]);
  }

  async function toggle(item: RoutineItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_done: !i.is_done } : i)));
    const supabase = createClient();
    await supabase.from("routines").update({ is_done: !item.is_done }).eq("id", item.id);
  }

  async function remove(item: RoutineItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const supabase = createClient();
    await supabase.from("routines").delete().eq("id", item.id);
  }

  return (
    <div>
      <h3 className="font-cute text-xl mb-2">
        {emoji} {label}
      </h3>
      <form onSubmit={handleAdd} className="flex gap-2 mb-2">
        <PixelInput
          className="flex-1"
          placeholder="루틴 항목 추가"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <PixelButton type="submit" tone="yellow" className="text-sm px-3">
          추가
        </PixelButton>
      </form>

      {loading ? (
        <p className="font-body text-sm text-pixel-ink-soft">불러오는 중...</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 border-2 border-pixel-border rounded-[8px] px-2.5 py-1.5 bg-pixel-bg"
            >
              <input
                type="checkbox"
                checked={item.is_done}
                onChange={() => toggle(item)}
                className="w-5 h-5 shrink-0 accent-pixel-yellow cursor-pointer"
              />
              <span
                className={`flex-1 min-w-0 font-body text-sm break-words ${
                  item.is_done ? "line-through text-pixel-ink-soft" : ""
                }`}
              >
                {item.label}
              </span>
              <button
                onClick={() => remove(item)}
                aria-label="삭제"
                className="font-pixel text-[10px] min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 border-2 border-pixel-border rounded-[6px] bg-pixel-red text-pixel-bg shadow-[var(--pixel-shadow-sm)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
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
