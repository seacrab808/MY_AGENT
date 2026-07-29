"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PixelButton } from "@/components/ui/PixelButton";

interface DiaryBoxProps {
  userId: string;
  dateKey: string;
}

export function DiaryBox({ userId, dateKey }: DiaryBoxProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("diary_entries")
      .select("content")
      .eq("entry_date", dateKey)
      .maybeSingle()
      .then(({ data }) => {
        setContent(data?.content ?? "");
        setLoading(false);
        setSavedAt(null);
      });
  }, [dateKey]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("diary_entries")
      .upsert(
        { user_id: userId, entry_date: dateKey, content, updated_at: new Date().toISOString() },
        { onConflict: "user_id,entry_date" },
      );
    setSaving(false);
    if (!error) {
      setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
    }
  }

  return (
    <div>
      <h3 className="font-cute text-xl mb-2">📓 오늘의 일기</h3>
      {loading ? (
        <p className="font-body text-sm text-pixel-ink-soft">불러오는 중...</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 하루는 어땠나요?"
            rows={6}
            className="w-full font-body text-sm px-3 py-2 border-[3px] border-pixel-border rounded-[10px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft focus:outline-none focus:ring-2 focus:ring-pixel-blue resize-none"
          />
          <div className="flex items-center gap-2 mt-2">
            <PixelButton tone="pink" onClick={handleSave} disabled={saving} className="text-sm px-3 py-1.5">
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
