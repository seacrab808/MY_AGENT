"use client";

import { useState } from "react";
import type { Paper, PaperNoteFields, TermConceptEntry } from "@/types/paper";
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

  function updateField(key: Exclude<keyof PaperNoteFields, "background">, value: string) {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }

  function addBackgroundEntry() {
    setNotes((prev) => ({ ...prev, background: [...prev.background, { term: "", concept: "" }] }));
  }

  function updateBackgroundEntry(index: number, field: keyof TermConceptEntry, value: string) {
    setNotes((prev) => ({
      ...prev,
      background: prev.background.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
    }));
  }

  function removeBackgroundEntry(index: number) {
    setNotes((prev) => ({ ...prev, background: prev.background.filter((_, i) => i !== index) }));
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
              {field.section && (
                <p className="font-cute text-sm font-bold text-pixel-purple mt-2 first:mt-0 pt-2 first:pt-0 border-t-2 border-dashed border-pixel-border first:border-t-0">
                  {field.section}
                </p>
              )}
              <label className="font-cute text-sm">
                {field.no}. {field.label}
              </label>
              <p className="font-body text-xs text-pixel-ink-soft italic">{field.question}</p>
              {field.key === "background" ? (
                <div className="flex flex-col gap-2">
                  {notes.background.length === 0 && (
                    <p className="font-body text-xs text-pixel-ink-soft">
                      아직 추가된 용어가 없어요. 아래 버튼으로 하나씩 추가해보세요.
                    </p>
                  )}
                  {notes.background.map((entry, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <PixelInput
                        value={entry.term}
                        onChange={(e) => updateBackgroundEntry(i, "term", e.target.value)}
                        placeholder="용어"
                        className="w-32 shrink-0 text-sm"
                      />
                      <span className="font-cute text-sm pt-2 shrink-0">→</span>
                      <textarea
                        value={entry.concept}
                        onChange={(e) => updateBackgroundEntry(i, "concept", e.target.value)}
                        placeholder="개념 설명"
                        rows={2}
                        className="flex-1 font-body text-sm px-3 py-2 border-2 border-pixel-border rounded-[12px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft shadow-[inset_0_1px_3px_rgba(120,90,70,0.08)] focus:outline-none focus:ring-2 focus:ring-pixel-purple resize-y"
                      />
                      <button
                        type="button"
                        onClick={() => removeBackgroundEntry(i)}
                        aria-label="용어 삭제"
                        className="shrink-0 font-cute text-xs font-bold min-w-[28px] min-h-[28px] mt-0.5 flex items-center justify-center border-2 border-pixel-border rounded-full bg-pixel-red text-pixel-bg shadow-[var(--pixel-shadow-sm)] active:scale-95 cursor-pointer transition-transform"
                      >
                        X
                      </button>
                    </div>
                  ))}
                  <PixelButton
                    type="button"
                    tone="blue"
                    onClick={addBackgroundEntry}
                    className="text-xs px-3 py-1 self-start"
                  >
                    + 용어 추가
                  </PixelButton>
                </div>
              ) : (
                <textarea
                  value={notes[field.key as Exclude<keyof PaperNoteFields, "background">]}
                  onChange={(e) =>
                    updateField(field.key as Exclude<keyof PaperNoteFields, "background">, e.target.value)
                  }
                  rows={3}
                  className="font-body text-sm px-3 py-2 border-2 border-pixel-border rounded-[12px] bg-pixel-bg text-pixel-ink placeholder:text-pixel-ink-soft shadow-[inset_0_1px_3px_rgba(120,90,70,0.08)] focus:outline-none focus:ring-2 focus:ring-pixel-purple resize-y"
                />
              )}
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
            <div key={field.key}>
              {field.section && (
                <h3 className="text-sm font-bold uppercase tracking-wide mt-3 mb-1 pt-2 border-t border-black/30 first:mt-0 first:pt-0 first:border-t-0">
                  {field.section}
                </h3>
              )}
              <div style={{ breakInside: "avoid" }} className="pb-2">
                <h2 className="text-base font-bold">
                  {field.no}. {field.label}
                </h2>
                <p className="text-xs italic mb-1">{field.question}</p>
                {field.key === "background" ? (
                  notes.background.length > 0 ? (
                    <ul className="text-sm list-disc pl-5">
                      {notes.background.map((entry, i) => (
                        <li key={i} className="whitespace-pre-wrap">
                          <strong>{entry.term || "(용어 없음)"}</strong> → {entry.concept || "—"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">—</p>
                  )
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{notes[field.key] || "—"}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
