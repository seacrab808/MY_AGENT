"use client";

import { FormEvent, useEffect, useState } from "react";
import { parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { RoutineItem, RoutinePeriod } from "@/types/routine";
import { sortByCompletion } from "@/lib/checklist";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCheckbox } from "@/components/ui/PixelCheckbox";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface TodayRoutineListProps {
  userId: string;
  dateKey: string;
}

const PERIODS: RoutinePeriod[] = ["morning", "afternoon", "evening"];

const PERIOD_META: Record<
  RoutinePeriod,
  { label: string; emoji: string; tone: "yellow" | "blue" | "purple"; chipClass: string }
> = {
  morning: { label: "오전", emoji: "🌅", tone: "yellow", chipClass: "bg-pixel-yellow" },
  afternoon: { label: "오후", emoji: "🌤️", tone: "blue", chipClass: "bg-pixel-blue" },
  evening: { label: "저녁", emoji: "🌙", tone: "purple", chipClass: "bg-pixel-purple" },
};

function periodRank(period: RoutinePeriod): number {
  return PERIODS.indexOf(period);
}

// 오전/오후/저녁(취침 전) 루틴을 하나로 통합한 "오늘의 Routine" 리스트. 항목마다 시간대 태그를
// 붙여서 구분하고(예전엔 카드 3개로 나눠져 있었음), 추가할 때만 시간대를 골라서 넣음.
export function TodayRoutineList({ userId, dateKey }: TodayRoutineListProps) {
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [input, setInput] = useState("");
  const [addPeriod, setAddPeriod] = useState<RoutinePeriod>("morning");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("routines")
      .select("*")
      .eq("routine_date", dateKey)
      .order("created_at", { ascending: true })
      .then(async ({ data, error }) => {
        const existingItems = !error && data ? (data as RoutineItem[]) : [];
        const existingKeys = new Set(existingItems.map((i) => `${i.period}:${i.label}`));

        // 그 요일의 프리셋(모든 시간대) 중 이 날짜에 아직 없는 항목만 채워 넣음. 이미 방문했던
        // 날짜라도 그 사이 프리셋에 새로 추가된 항목이 있으면 다음 방문 시 반영되도록 매번 확인함.
        const dow = parseISO(dateKey).getDay();
        const { data: presetData } = await supabase
          .from("routine_presets")
          .select("period, label")
          .eq("day_of_week", dow)
          .order("created_at", { ascending: true });

        const missing = (presetData ?? []).filter(
          (p) => !existingKeys.has(`${p.period}:${p.label}`),
        );

        if (missing.length === 0) {
          setItems(existingItems);
          setLoading(false);
          return;
        }

        const newRows = missing.map((p) => ({
          user_id: userId,
          period: p.period,
          routine_date: dateKey,
          label: p.label,
          is_done: false,
        }));

        const { data: insertedData } = await supabase.from("routines").insert(newRows).select();

        setItems([...existingItems, ...((insertedData ?? []) as RoutineItem[])]);
        setLoading(false);
      });
  }, [userId, dateKey]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    setInput("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("routines")
      .insert({ user_id: userId, period: addPeriod, routine_date: dateKey, label: value })
      .select()
      .single();

    if (!error && data) setItems((prev) => [...prev, data as RoutineItem]);
  }

  async function toggle(item: RoutineItem) {
    const nextDone = !item.is_done;
    const completedAt = nextDone ? new Date().toISOString() : null;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_done: nextDone, completed_at: completedAt } : i)),
    );
    const supabase = createClient();
    await supabase
      .from("routines")
      .update({ is_done: nextDone, completed_at: completedAt })
      .eq("id", item.id);
  }

  async function remove(item: RoutineItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const supabase = createClient();
    await supabase.from("routines").delete().eq("id", item.id);
  }

  // 체크한 항목은 시간대 구분 없이 체크한 순서대로 맨 위에 모으고, 아직 안 한 항목만 기존처럼
  // 오전 → 오후 → 저녁 순으로 그 아래에 묶어서 보여줌.
  const sorted = sortByCompletion(items, (a, b) => {
    const rankDiff = periodRank(a.period) - periodRank(b.period);
    if (rankDiff !== 0) return rankDiff;
    return a.created_at.localeCompare(b.created_at);
  });
  const doneCount = items.filter((i) => i.is_done).length;

  return (
    <div>
      <h3 className="font-cute text-xl mb-2">🔄 오늘의 Routine</h3>
      <ProgressBar done={doneCount} total={items.length} className="mb-3" />

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-2">
        <div className="flex gap-1 shrink-0">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setAddPeriod(period)}
              className={`font-cute text-sm px-2.5 py-1.5 border-2 border-pixel-border rounded-[10px] cursor-pointer transition-colors ${
                addPeriod === period
                  ? `${PERIOD_META[period].chipClass} text-pixel-chip-ink`
                  : "bg-pixel-bg text-pixel-ink-soft"
              }`}
            >
              {PERIOD_META[period].emoji} {PERIOD_META[period].label}
            </button>
          ))}
        </div>
        <PixelInput
          className="flex-1 min-w-[120px]"
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
      ) : sorted.length === 0 ? (
        <p className="font-body text-sm text-pixel-ink-soft py-2">아직 루틴이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 border-2 border-pixel-border rounded-[10px] px-2.5 py-1.5 bg-pixel-bg"
            >
              <PixelCheckbox
                checked={item.is_done}
                onChange={() => toggle(item)}
                tone={PERIOD_META[item.period].tone}
              />
              <span
                className={`shrink-0 font-body text-[11px] font-semibold px-2 py-0.5 rounded-full text-pixel-chip-ink ${PERIOD_META[item.period].chipClass}`}
              >
                {PERIOD_META[item.period].label}
              </span>
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
