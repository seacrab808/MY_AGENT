"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PixelButton } from "@/components/ui/PixelButton";

interface DiaryBoxProps {
  userId: string;
  dateKey: string;
}

const MOODS = ["😊", "🙂", "😐", "😢", "😡", "😴"];

export function DiaryBox({ userId, dateKey }: DiaryBoxProps) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("diary_entries")
      .select("content, mood")
      .eq("entry_date", dateKey)
      .maybeSingle()
      .then(({ data, error }) => {
        setContent(data?.content ?? "");
        setMood(data?.mood ?? null);
        setLoading(false);
        setSavedAt(null);
        // 불러오기 실패(예: mood 컬럼이 아직 없는 DB)도 조용히 넘기지 않고 표시 — 그냥 빈 칸으로만
        // 보이면 "저장이 안 됐나?"로 오해하기 쉬움
        setErrorMsg(error ? `불러오기 실패: ${error.message}` : null);
      });
  }, [dateKey]);

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("diary_entries")
      .upsert(
        { user_id: userId, entry_date: dateKey, content, mood, updated_at: new Date().toISOString() },
        { onConflict: "user_id,entry_date" },
      );
    setSaving(false);
    if (error) {
      // 예전에는 실패해도 아무 표시가 없어서 "저장이 안 되는데 왜 안 되는지도 모르겠다"는 문제가
      // 있었음 — 실제 원인(대부분 supabase/migrations/0009_diary_mood_and_retrospectives.sql을 아직
      // 실행 안 해서 mood 컬럼이 없는 경우)이 바로 보이게 에러 메시지를 그대로 노출.
      setErrorMsg(`저장 실패: ${error.message}`);
    } else {
      setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-cute text-xl">📓 오늘의 일기</h3>
        {!loading && (
          <div className="flex items-center gap-1 shrink-0">
            {MOODS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setMood((cur) => (cur === emoji ? null : emoji))}
                aria-pressed={mood === emoji}
                aria-label={`기분: ${emoji}`}
                className={`w-8 h-8 flex items-center justify-center text-lg rounded-full border-2 cursor-pointer transition-transform ${
                  mood === emoji
                    ? "border-pixel-purple bg-pixel-purple/40 scale-110"
                    : "border-transparent hover:scale-110 opacity-60 hover:opacity-100"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      {loading ? (
        <p className="font-body text-sm text-pixel-ink-soft">불러오는 중...</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 하루는 어땠나요?"
            rows={6}
            className="w-full font-body text-sm px-3 py-2 border-2 border-pixel-border rounded-[14px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft focus:outline-none focus:ring-2 focus:ring-pixel-purple resize-none"
          />
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <PixelButton tone="pink" onClick={handleSave} disabled={saving} className="text-sm px-3 py-1.5">
              {saving ? "저장중..." : "저장"}
            </PixelButton>
            {savedAt && (
              <span className="font-body text-xs text-pixel-ink-soft">{savedAt}에 저장됨</span>
            )}
            {errorMsg && (
              <span className="font-body text-xs text-pixel-red break-all">{errorMsg}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
