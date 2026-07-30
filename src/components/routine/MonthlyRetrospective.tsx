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

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("retrospectives")
      .select("content")
      .eq("period_key", periodKey)
      .maybeSingle()
      .then(({ data }) => {
        setContent(data?.content ?? "");
        setLoading(false);
        setSavedAt(null);
      });
  }, [periodKey]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("retrospectives")
      .upsert(
        { user_id: userId, period_key: periodKey, content, updated_at: new Date().toISOString() },
        { onConflict: "user_id,period_key" },
      );
    setSaving(false);
    if (!error) {
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
          <div className="flex items-center gap-2 mt-2">
            <PixelButton tone="purple" onClick={handleSave} disabled={saving} className="text-sm px-3 py-1.5">
              {saving ? "저장중..." : "저장"}
            </PixelButton>
            {savedAt && (
              <span className="font-body text-xs text-pixel-ink-soft">{savedAt}에 저장됨</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
