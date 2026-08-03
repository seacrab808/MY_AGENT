"use client";

import { useState } from "react";
import type { Paper, PaperNoteFields } from "@/types/paper";
import { PAPER_NOTE_FIELDS } from "@/lib/paperNotes";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";

interface PaperNoteFormProps {
  paper: Paper;
  onSave: (title: string, url: string, notes: PaperNoteFields) => Promise<{ error?: string } | void>;
  onDelete: () => void;
}

// 부모(PapersTab)가 <PaperNoteForm key={paper.id} .../>로 렌더링해서 논문을 바꿀 때마다
// 컴포넌트 자체를 새로 만들어주기 때문에, 여기서는 prop 변경을 감지하는 useEffect 없이
// paper를 그대로 초기값으로 써도 안전함(EventDetailModal과 동일한 패턴).
export function PaperNoteForm({ paper, onSave, onDelete }: PaperNoteFormProps) {
  const [title, setTitle] = useState(paper.title);
  const [url, setUrl] = useState(paper.url ?? "");
  const [notes, setNotes] = useState<PaperNoteFields>(paper.notes);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function updateField(key: keyof PaperNoteFields, value: string) {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    const result = await onSave(title.trim() || "제목 없음", url.trim(), notes);
    setSaving(false);
    if (result && "error" in result && result.error) {
      setErrorMsg(`저장 실패: ${result.error}`);
    } else {
      setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
    }
  }

  return (
    <>
      <PixelCard className="flex flex-col gap-4 print:hidden" tape="purple">
        <div className="flex flex-col gap-2">
          <PixelInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="논문 제목"
            className="font-cute text-lg"
          />
          <div className="flex gap-2">
            <PixelInput
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="PDF 링크 (예: https://arxiv.org/pdf/...)"
              className="flex-1"
            />
            {url.trim() && (
              <a
                href={url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-cute font-bold text-sm px-3 flex items-center border-2 border-pixel-border rounded-[12px] shadow-[var(--pixel-bevel)] whitespace-nowrap active:scale-[0.97] active:shadow-[var(--pixel-bevel-active)] transition-all cursor-pointer bg-gradient-to-b from-[#b7cfff] to-pixel-blue text-pixel-chip-ink"
              >
                PDF 열기 ↗
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {PAPER_NOTE_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="font-cute text-sm">
                {field.no}. {field.label}
              </label>
              <p className="font-body text-xs text-pixel-ink-soft italic">{field.question}</p>
              <textarea
                value={notes[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                rows={3}
                className="font-body text-sm px-3 py-2 border-2 border-pixel-border rounded-[12px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft shadow-[inset_0_1px_3px_rgba(120,90,70,0.08)] focus:outline-none focus:ring-2 focus:ring-pixel-purple resize-y"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1 border-t-2 border-dashed border-pixel-border">
          <PixelButton tone="mint" onClick={handleSave} disabled={saving} className="text-sm px-4 py-1.5">
            {saving ? "저장중..." : "저장"}
          </PixelButton>
          <PixelButton
            type="button"
            tone="yellow"
            onClick={() => window.print()}
            className="text-sm px-4 py-1.5"
          >
            📄 PDF로 내보내기
          </PixelButton>
          <PixelButton
            type="button"
            tone="red"
            onClick={onDelete}
            className="text-sm px-4 py-1.5"
          >
            삭제
          </PixelButton>
          {savedAt && <span className="font-body text-xs text-pixel-ink-soft">{savedAt}에 저장됨</span>}
          {errorMsg && <span className="font-body text-xs text-pixel-red break-all">{errorMsg}</span>}
        </div>
      </PixelCard>

      {/* PDF로 내보내기(=window.print) 시에만 보이는 인쇄용 뷰. 화면엔 항상 숨겨져 있고,
          방금 화면에서 편집 중이던 내용(아직 저장 전이라도)을 그대로 반영해서 출력함. 인쇄 시
          다크모드든 라이트모드든 항상 흰 배경에 검은 글씨가 되도록 globals.css의
          `.paper-print` 규칙이 색을 강제로 덮어씀. */}
      <div className="paper-print hidden print:block">
        <h1 className="text-2xl font-bold mb-1">{title.trim() || "제목 없음"}</h1>
        {url.trim() && <p className="text-sm mb-4 break-all">{url.trim()}</p>}
        <div className="flex flex-col gap-4 mt-4">
          {PAPER_NOTE_FIELDS.map((field) => (
            <div key={field.key} style={{ breakInside: "avoid" }} className="pb-2">
              <h2 className="text-base font-bold">
                {field.no}. {field.label}
              </h2>
              <p className="text-xs italic mb-1">{field.question}</p>
              <p className="text-sm whitespace-pre-wrap">{notes[field.key] || "—"}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
