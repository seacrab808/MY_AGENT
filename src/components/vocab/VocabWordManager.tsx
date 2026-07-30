"use client";

import { FormEvent, useRef, useState } from "react";
import type { VocabGroup, VocabWord } from "@/types/vocab";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";

const UNGROUPED = "__ungrouped__";

interface VocabWordManagerProps {
  words: VocabWord[];
  groups: VocabGroup[];
  onAdd: (term: string, meaning: string, groupId: string | null) => void;
  onRemove: (word: VocabWord) => void;
  onToggleStarred: (word: VocabWord) => void;
  onToggleTriangled: (word: VocabWord) => void;
  onCreateGroup: (name: string) => Promise<VocabGroup | null>;
  onRenameGroup: (groupId: string, name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  className?: string;
}

export function VocabWordManager({
  words,
  groups,
  onAdd,
  onRemove,
  onToggleStarred,
  onToggleTriangled,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  className = "",
}: VocabWordManagerProps) {
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  // null = 사용자가 아직 탭을 직접 고르지 않음 -> 그룹이 있으면 첫 그룹, 없으면 미분류를 기본값으로 보여줌
  const [explicitTab, setExplicitTab] = useState<string | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDeleteGroup, setConfirmingDeleteGroup] = useState(false);
  const termInputRef = useRef<HTMLInputElement>(null);

  const activeTab = explicitTab ?? (groups.length > 0 ? groups[0].id : UNGROUPED);
  const setActiveTab = setExplicitTab;

  const activeGroupId = activeTab === UNGROUPED ? null : activeTab;
  const activeGroup = groups.find((g) => g.id === activeTab) ?? null;
  const visibleWords = words.filter((w) => (w.group_id ?? UNGROUPED) === activeTab);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!term.trim() || !meaning.trim()) return;
    onAdd(term.trim(), meaning.trim(), activeGroupId);
    setTerm("");
    setMeaning("");
    termInputRef.current?.focus();
  }

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const group = await onCreateGroup(newGroupName.trim());
    setNewGroupName("");
    setAddingGroup(false);
    if (group) setActiveTab(group.id);
  }

  function startRename() {
    setRenameValue(activeGroup?.name ?? "");
    setRenaming(true);
  }

  function submitRename(e: FormEvent) {
    e.preventDefault();
    if (activeGroup && renameValue.trim()) {
      onRenameGroup(activeGroup.id, renameValue.trim());
    }
    setRenaming(false);
  }

  return (
    <PixelCard className={`flex flex-col ${className}`}>
      <h2 className="font-cute text-2xl mb-3 shrink-0">🃏 단어 추가</h2>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setActiveTab(UNGROUPED)}
          className={`font-cute text-sm px-3 py-1.5 border-2 border-pixel-border rounded-[8px] cursor-pointer transition-transform ${
            activeTab === UNGROUPED
              ? "bg-pixel-blue text-pixel-chip-ink"
              : "bg-pixel-bg hover:-translate-y-0.5"
          }`}
        >
          미분류
        </button>
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setActiveTab(group.id)}
            className={`font-cute text-sm px-3 py-1.5 border-2 border-pixel-border rounded-[8px] cursor-pointer transition-transform ${
              activeTab === group.id
                ? "bg-pixel-blue text-pixel-chip-ink"
                : "bg-pixel-bg hover:-translate-y-0.5"
            }`}
          >
            {group.name}
          </button>
        ))}

        {addingGroup ? (
          <form onSubmit={handleCreateGroup} className="flex items-center gap-1">
            <PixelInput
              autoFocus
              placeholder="그룹 이름 (예: DAY1)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="text-sm px-2 py-1 w-32"
            />
            <PixelButton type="submit" tone="mint" className="text-xs px-2 py-1">
              생성
            </PixelButton>
            <PixelButton
              type="button"
              tone="ink"
              className="text-xs px-2 py-1"
              onClick={() => {
                setAddingGroup(false);
                setNewGroupName("");
              }}
            >
              취소
            </PixelButton>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAddingGroup(true)}
            className="font-cute text-sm px-3 py-1.5 border-2 border-dashed border-pixel-border rounded-[8px] cursor-pointer text-pixel-ink-soft hover:-translate-y-0.5"
          >
            + 새 그룹
          </button>
        )}
      </div>

      {activeGroup && (
        <div className="flex items-center gap-2 mb-3">
          {renaming ? (
            <form onSubmit={submitRename} className="flex items-center gap-1">
              <PixelInput
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="text-sm px-2 py-1 w-32"
              />
              <PixelButton type="submit" tone="mint" className="text-xs px-2 py-1">
                저장
              </PixelButton>
              <PixelButton type="button" tone="ink" className="text-xs px-2 py-1" onClick={() => setRenaming(false)}>
                취소
              </PixelButton>
            </form>
          ) : (
            <>
              <span className="font-body text-xs text-pixel-ink-soft">
                <strong>{activeGroup.name}</strong> 그룹에 추가하는 중
              </span>
              <button
                type="button"
                onClick={startRename}
                className="font-body text-xs text-pixel-ink-soft underline cursor-pointer"
              >
                이름 수정
              </button>
              {confirmingDeleteGroup ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteGroup(activeGroup.id);
                      setActiveTab(UNGROUPED);
                      setConfirmingDeleteGroup(false);
                    }}
                    className="font-body text-xs text-pixel-red underline cursor-pointer"
                  >
                    정말 삭제
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteGroup(false)}
                    className="font-body text-xs text-pixel-ink-soft underline cursor-pointer"
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDeleteGroup(true)}
                  className="font-body text-xs text-pixel-red underline cursor-pointer"
                >
                  그룹 삭제
                </button>
              )}
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <PixelInput
          ref={termInputRef}
          className="flex-1"
          placeholder="단어 (예: ubiquitous)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <PixelInput
          className="flex-1"
          placeholder="뜻 (예: 도처에 있는)"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
        />
        <PixelButton type="submit" tone="mint" className="text-sm px-4">
          추가
        </PixelButton>
      </form>

      {visibleWords.length === 0 ? (
        <p className="font-body text-sm text-pixel-ink-soft py-2">
          아직 등록된 단어가 없어요. 위에서 추가해보세요!
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
          {visibleWords.map((word) => (
            <li
              key={word.id}
              className={`flex items-center gap-2 border-2 border-pixel-border rounded-[8px] px-2.5 py-1.5 ${
                word.is_starred ? "bg-pixel-yellow text-pixel-chip-ink" : "bg-pixel-bg"
              }`}
            >
              <span className="font-cute text-base shrink-0 max-w-[40%] break-words">{word.term}</span>
              <span className="font-body text-sm text-pixel-ink-soft flex-1 min-w-0 break-words">
                {word.meaning}
              </span>
              <button
                onClick={() => onToggleStarred(word)}
                title="별표 (어려운 단어)"
                className={`font-pixel text-[10px] min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 border-2 border-pixel-border rounded-[6px] shadow-[var(--pixel-shadow-sm)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                  word.is_starred ? "bg-pixel-red text-pixel-bg" : "bg-pixel-panel"
                }`}
              >
                ★
              </button>
              <button
                onClick={() => onToggleTriangled(word)}
                title="세모 (이제 잘 아는 단어)"
                className={`font-pixel text-[10px] min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 border-2 border-pixel-border rounded-[6px] shadow-[var(--pixel-shadow-sm)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                  word.is_triangled ? "bg-pixel-mint text-pixel-chip-ink" : "bg-pixel-panel"
                }`}
              >
                ▲
              </button>
              <button
                onClick={() => onRemove(word)}
                aria-label="삭제"
                className="font-pixel text-[10px] min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 border-2 border-pixel-border rounded-[6px] bg-pixel-red text-pixel-bg shadow-[var(--pixel-shadow-sm)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                X
              </button>
            </li>
          ))}
        </ul>
      )}
    </PixelCard>
  );
}
