"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Paper, PaperNoteFields } from "@/types/paper";
import { emptyPaperNotes, normalizePaperNotes } from "@/lib/paperNotes";
import { PaperList } from "@/components/paper/PaperList";
import { PaperNoteForm } from "@/components/paper/PaperNoteForm";

interface PapersTabProps {
  userId: string;
}

interface RawPaperRow {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  notes: unknown;
  created_at: string;
  updated_at: string;
}

function toPaper(row: RawPaperRow): Paper {
  return { ...row, notes: normalizePaperNotes(row.notes) };
}

export function PapersTab({ userId }: PapersTabProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("papers")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const loaded = (data as RawPaperRow[]).map(toPaper);
          setPapers(loaded);
          if (loaded.length > 0) setSelectedId(loaded[0].id);
        }
        setLoading(false);
      });
  }, []);

  async function handleAdd(title: string, url: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("papers")
      .insert({ user_id: userId, title, url: url || null, notes: emptyPaperNotes() })
      .select()
      .single();
    if (!error && data) {
      const paper = toPaper(data as RawPaperRow);
      setPapers((prev) => [paper, ...prev]);
      setSelectedId(paper.id);
    }
  }

  async function handleSave(
    paperId: string,
    title: string,
    url: string,
    notes: PaperNoteFields,
  ): Promise<{ error?: string } | void> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("papers")
      .update({ title, url: url || null, notes, updated_at: new Date().toISOString() })
      .eq("id", paperId)
      .select()
      .single();
    if (error) return { error: error.message };
    if (data) {
      const paper = toPaper(data as RawPaperRow);
      setPapers((prev) => prev.map((p) => (p.id === paperId ? paper : p)));
    }
  }

  async function handleDelete(paper: Paper) {
    setPapers((prev) => prev.filter((p) => p.id !== paper.id));
    if (selectedId === paper.id) setSelectedId(null);
    const supabase = createClient();
    await supabase.from("papers").delete().eq("id", paper.id);
  }

  const selectedPaper = papers.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="print:hidden">
        <h1 className="font-cute text-3xl font-bold">논문 리딩</h1>
        <p className="font-body text-sm text-pixel-ink-soft">
          📄 정곡을 찌르는 문제인지, 왜 지금까지 못 봤는지, 왜 재밌는지, 그래서 뭘 배웠는지 — 16개 질문으로 정리해요
        </p>
      </div>

      {loading ? (
        <p className="font-body text-sm text-pixel-ink-soft print:hidden">불러오는 중...</p>
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
          <div className="print:hidden lg:sticky lg:top-4">
            <PaperList
              papers={papers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={handleAdd}
              onDelete={handleDelete}
            />
          </div>

          {selectedPaper ? (
            <PaperNoteForm
              key={selectedPaper.id}
              paper={selectedPaper}
              onSave={(title, url, notes) => handleSave(selectedPaper.id, title, url, notes)}
              onDelete={() => handleDelete(selectedPaper)}
            />
          ) : (
            <p className="font-body text-sm text-pixel-ink-soft print:hidden">
              왼쪽에서 논문을 추가하거나 골라보세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
