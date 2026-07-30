"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoutinePeriod, RoutinePreset } from "@/types/routine";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";

interface RoutinePresetTabProps {
  userId: string;
}

const WEEKDAYS = [
  { dow: 1, label: "월요일" },
  { dow: 2, label: "화요일" },
  { dow: 3, label: "수요일" },
  { dow: 4, label: "목요일" },
  { dow: 5, label: "금요일" },
  { dow: 6, label: "토요일" },
  { dow: 0, label: "일요일" },
];

const PERIOD_CONFIG: { period: RoutinePeriod; label: string; emoji: string; tone: "yellow" | "blue" | "purple" }[] = [
  { period: "morning", label: "오전 루틴", emoji: "🌅", tone: "yellow" },
  { period: "afternoon", label: "오후 루틴", emoji: "🌤️", tone: "blue" },
  { period: "evening", label: "퇴근 후 루틴", emoji: "🌙", tone: "purple" },
];

export function RoutinePresetTab({ userId }: RoutinePresetTabProps) {
  const [selectedDow, setSelectedDow] = useState<number>(1); // 기본: 월요일
  const [presets, setPresets] = useState<RoutinePreset[]>([]);
  const [loading, setLoading] = useState(true);

  // 각 섹션별 입력값
  const [inputs, setInputs] = useState<Record<RoutinePeriod, string>>({
    morning: "",
    afternoon: "",
    evening: "",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("routine_presets")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error) setPresets((data ?? []) as RoutinePreset[]);
        setLoading(false);
      });
  }, []);

  async function handleAdd(period: RoutinePeriod, e: FormEvent) {
    e.preventDefault();
    const value = (inputs[period] ?? "").trim();
    if (!value) return;

    setInputs((prev) => ({ ...prev, [period]: "" }));

    const supabase = createClient();
    const { data, error } = await supabase
      .from("routine_presets")
      .insert({
        user_id: userId,
        day_of_week: selectedDow,
        period,
        label: value,
      })
      .select()
      .single();

    if (!error && data) {
      setPresets((prev) => [...prev, data as RoutinePreset]);
    }
  }

  async function handleRemove(id: string) {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    const supabase = createClient();
    await supabase.from("routine_presets").delete().eq("id", id);
  }

  const selectedDayLabel = WEEKDAYS.find((w) => w.dow === selectedDow)?.label ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-cute text-3xl font-bold">하루 루틴</h1>
        <p className="font-body text-sm text-pixel-ink-soft">🔄 요일마다 반복할 루틴을 미리 등록해요</p>
      </div>

      <PixelCard>
        <h2 className="font-cute text-2xl mb-1">🔄 요일별 하루 루틴 설정</h2>
        <p className="font-body text-sm text-pixel-ink-soft mb-4">
          요일별로 반복할 루틴을 등록해두면 일일 플래너의 &apos;오전/오후/퇴근 후 TODO&apos;에 자동으로 연결돼요.
        </p>

        {/* 요일 선택 버튼 목록 */}
        <div className="flex flex-wrap gap-2 mb-2">
          {WEEKDAYS.map((w) => (
            <button
              key={w.dow}
              type="button"
              onClick={() => setSelectedDow(w.dow)}
              className={`font-cute text-base px-3 py-1.5 border-[3px] border-pixel-border rounded-[10px] cursor-pointer transition-transform ${
                selectedDow === w.dow
                  ? "bg-gradient-to-b from-[#b7cfff] to-pixel-blue shadow-[var(--pixel-bevel-active)] text-pixel-chip-ink font-bold"
                  : "bg-pixel-panel shadow-[var(--pixel-bevel)] hover:-translate-y-0.5"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </PixelCard>

      {loading ? (
        <PixelCard>
          <p className="font-body text-sm text-pixel-ink-soft">불러오는 중...</p>
        </PixelCard>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {PERIOD_CONFIG.map(({ period, label, emoji, tone }) => {
            const periodPresets = presets.filter(
              (p) => p.day_of_week === selectedDow && p.period === period,
            );

            return (
              <PixelCard key={period}>
                <h3 className="font-cute text-xl mb-3">
                  {emoji} {selectedDayLabel} {label}
                </h3>

                <form
                  onSubmit={(e) => handleAdd(period, e)}
                  className="flex gap-2 mb-3"
                >
                  <PixelInput
                    className="flex-1 text-sm"
                    placeholder={`${label} 추가`}
                    value={inputs[period] ?? ""}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [period]: e.target.value }))
                    }
                  />
                  <PixelButton type="submit" tone={tone} className="text-sm px-3">
                    추가
                  </PixelButton>
                </form>

                {periodPresets.length === 0 ? (
                  <p className="font-body text-xs text-pixel-ink-soft py-2">
                    {selectedDayLabel} {label} 항목이 없어요.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {periodPresets.map((preset) => (
                      <li
                        key={preset.id}
                        className="flex items-center justify-between gap-2 border-2 border-pixel-border rounded-[8px] px-2.5 py-1.5 bg-pixel-bg"
                      >
                        <span className="font-body text-sm flex-1 min-w-0 break-words">
                          {preset.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemove(preset.id)}
                          aria-label="삭제"
                          className="font-pixel text-[10px] min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0 border-2 border-pixel-border rounded-[6px] bg-pixel-red text-pixel-bg shadow-[var(--pixel-shadow-sm)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                        >
                          X
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </PixelCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
