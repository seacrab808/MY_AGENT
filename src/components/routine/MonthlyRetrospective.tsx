"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PixelButton } from "@/components/ui/PixelButton";

interface MonthlyRetrospectiveProps {
  userId: string;
  periodKey: string; // monthKey() 형식, 'yyyy-MM'
}

export function MonthlyRetrospective({ userId, periodKey }: MonthlyRetrospectiveProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("retrospectives")
      .select("content")
      .eq("period_key", periodKey)
      .maybeSingle()
      .then(({ data, error }) => {
        setContent(data?.content ?? "");
        setLoading(false);
        setSavedAt(null);
        // 불러오기 실패(예: retrospectives 테이블이 아직 없는 DB)도 조용히 넘기지 않고 표시 — 그냥
        // 빈 칸으로만 보이면 "저장이 안 됐나?"로 오해하기 쉬움
        setErrorMsg(error ? `불러오기 실패: ${error.message}` : null);
      });
  }, [periodKey]);

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("retrospectives")
      .upsert(
        { user_id: userId, period_key: periodKey, content, updated_at: new Date().toISOString() },
        { onConflict: "user_id,period_key" },
      );
    setSaving(false);
    if (error) {
      // 예전에는 실패해도 아무 표시가 없어서 "저장이 안 되는데 왜 안 되는지도 모르겠다"는 문제가
      // 있었음 — 실제 원인(대부분 supabase/migrations/0009_diary_mood_and_retrospectives.sql을 아직
      // 실행 안 해서 retrospectives 테이블이 없는 경우)이 바로 보이게 에러 메시지를 그대로 노출.
      setErrorMsg(`저장 실패: ${error.message}`);
    } else {
      setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
    }
  }

  return (
    <div>
      <h3 className="font-cute text-xl mb-2">📖 이달의 회고</h3>
      {loading ? (
        <p className="font-body text-sm text-pixel-ink-soft">불러오는 중...</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="이번 달은 어땠나요? 잘한 점, 아쉬운 점을 적어봐요."
            rows={10}
            className="w-full font-body text-sm px-3 py-2 border-2 border-pixel-border rounded-[14px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft focus:outline-none focus:ring-2 focus:ring-pixel-purple resize-none"
          />
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <PixelButton tone="purple" onClick={handleSave} disabled={saving} className="text-sm px-3 py-1.5">
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
