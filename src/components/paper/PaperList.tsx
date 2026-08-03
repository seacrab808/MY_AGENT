"use client";

import { FormEvent, useState } from "react";
import type { Paper } from "@/types/paper";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";

interface PaperListProps {
  papers: Paper[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (title: string, url: string) => void;
  onDelete: (paper: Paper) => void;
}

export function PaperList({ papers, selectedId, onSelect, onAdd, onDelete }: PaperListProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), url.trim());
    setTitle("");
    setUrl("");
  }

  return (
    <PixelCard className="flex flex-col" tape="blue">
      <h2 className="font-cute text-2xl mb-3 shrink-0">📄 논문 목록</h2>

      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-4 shrink-0">
        <PixelInput
          placeholder="논문 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <PixelInput
          type="url"
          placeholder="PDF 링크 (선택, 예: https://arxiv.org/pdf/...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <PixelButton type="submit" tone="blue" className="text-sm px-4 self-start">
          + 논문 추가
        </PixelButton>
      </form>

      {papers.length === 0 ? (
        <p className="font-body text-sm text-pixel-ink-soft py-2">
          아직 등록된 논문이 없어요. 위에서 제목(과 링크)을 추가해보세요!
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
          {papers.map((paper) => {
            const isActive = paper.id === selectedId;
            return (
              <li key={paper.id}>
                <div
                  className={`flex items-center gap-1.5 border-2 rounded-[10px] px-2.5 py-2 transition-colors ${
                    isActive
                      ? "border-pixel-purple bg-gradient-to-br from-[var(--sidebar-active-from)] to-[var(--sidebar-active-to)]"
                      : "border-pixel-border bg-pixel-bg hover:border-pixel-purple/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(paper.id)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <p className="font-cute text-sm break-words">{paper.title}</p>
                  </button>
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="새 창에서 PDF 열기"
                      aria-label="새 창에서 PDF 열기"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 font-body text-xs font-bold min-w-[28px] min-h-[28px] flex items-center justify-center border-2 border-pixel-border rounded-full bg-pixel-panel shadow-[var(--pixel-shadow-sm)] active:scale-95 cursor-pointer transition-transform"
                    >
                      ↗
                    </a>
                  )}
                  {confirmingId === paper.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(paper);
                          setConfirmingId(null);
                        }}
                        className="font-body text-xs text-pixel-red underline cursor-pointer"
                      >
                        삭제
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="font-body text-xs text-pixel-ink-soft underline cursor-pointer"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(paper.id)}
                      aria-label="삭제"
                      className="shrink-0 font-cute text-xs font-bold min-w-[28px] min-h-[28px] flex items-center justify-center border-2 border-pixel-border rounded-full bg-pixel-red text-pixel-bg shadow-[var(--pixel-shadow-sm)] active:scale-95 cursor-pointer transition-transform"
                    >
                      X
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PixelCard>
  );
}
