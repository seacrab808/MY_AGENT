"use client";

import { useRef, useState, type ClipboardEvent } from "react";
import { plainValueToEditableHtml, sanitizeHtml } from "@/lib/richText";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  minHeightClassName?: string;
}

const HIGHLIGHT_COLOR = "#fff59d";

// contentEditable을 "제어 컴포넌트"로 만들면(매 입력마다 dangerouslySetInnerHTML을 새로 내려주면)
// 캐럿 위치가 튕기므로, 마운트 시 초기 HTML만 한 번 넣고 그 뒤로는 리액트가 이 div의 자식을
// 건드리지 않게 함(state에 담긴 initialHtml은 절대 갱신하지 않음 — PaperNoteForm이 이미 논문마다
// key={paper.id}로 폼 전체를 새로 마운트하므로, 논문을 바꾸면 이 컴포넌트도 함께 새로 만들어져
// 초기값 문제가 없음).
export function RichTextEditor({ value, onChange, placeholder, minHeightClassName = "min-h-[4.5rem]" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialHtml] = useState(() => plainValueToEditableHtml(value));
  const [isEmpty, setIsEmpty] = useState(() => value.trim() === "");

  function syncChange() {
    const el = editorRef.current;
    if (!el) return;
    onChange(sanitizeHtml(el.innerHTML));
    setIsEmpty((el.textContent ?? "").trim() === "");
  }

  function applyBold() {
    editorRef.current?.focus();
    document.execCommand("bold");
    syncChange();
  }

  function applyHighlight() {
    const el = editorRef.current;
    const selection = window.getSelection();
    if (!el || !selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;
    const mark = document.createElement("mark");
    mark.style.backgroundColor = HIGHLIGHT_COLOR;
    try {
      range.surroundContents(mark);
    } catch {
      // 선택 영역이 여러 블록(div)에 걸쳐 있으면 surroundContents가 실패함 — extractContents로 대체.
      const frag = range.extractContents();
      mark.appendChild(frag);
      range.insertNode(mark);
    }
    selection.removeAllRanges();
    const collapsed = document.createRange();
    collapsed.selectNodeContents(mark);
    collapsed.collapse(false);
    selection.addRange(collapsed);
    syncChange();
  }

  function clearFormatting() {
    editorRef.current?.focus();
    document.execCommand("removeFormat");
    syncChange();
  }

  // 붙여넣기를 그대로 허용하면 브라우저가 클립보드의 HTML을 바로 파싱/삽입하는데, 그 안에
  // <img onerror=...>같은 게 있으면 sanitizeHtml이 개입하기도 전에(=onInput 핸들러가 실행되기 전에)
  // 즉시 실행돼버림(직접 확인함: 그런 페이로드를 붙여넣었을 때 우리 쪽 필터링과 무관하게 먼저 실행됨).
  // 그래서 붙여넣기는 항상 서식 없는 텍스트로만 받고, 굵게/하이라이트는 이 에디터의 버튼으로만 적용함.
  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    syncChange();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyBold}
          title="굵게 (선택한 텍스트에 적용)"
          className="font-cute text-xs font-bold min-w-[26px] h-[26px] flex items-center justify-center border-2 border-pixel-border rounded-full bg-pixel-panel shadow-[var(--pixel-shadow-sm)] active:scale-95 cursor-pointer transition-transform"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyHighlight}
          title="하이라이트 (선택한 텍스트에 적용)"
          className="font-cute text-xs font-bold min-w-[26px] h-[26px] flex items-center justify-center border-2 border-pixel-border rounded-full bg-pixel-panel shadow-[var(--pixel-shadow-sm)] active:scale-95 cursor-pointer transition-transform"
        >
          🖍
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clearFormatting}
          title="서식 지우기"
          className="font-body text-[10px] text-pixel-ink-soft px-2 h-[26px] flex items-center justify-center border-2 border-pixel-border rounded-full bg-pixel-panel active:scale-95 cursor-pointer transition-transform"
        >
          지우기
        </button>
      </div>
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute left-3 top-2 font-body text-sm text-pixel-ink-soft">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncChange}
          onPaste={handlePaste}
          dangerouslySetInnerHTML={{ __html: initialHtml }}
          className={`${minHeightClassName} w-full font-body text-sm px-3 py-2 border-2 border-pixel-border rounded-[12px] bg-pixel-bg text-pixel-ink shadow-[inset_0_1px_3px_rgba(120,90,70,0.08)] focus:outline-none focus:ring-2 focus:ring-pixel-purple whitespace-pre-wrap break-words [&_mark]:rounded-[2px] [&_mark]:px-0.5`}
        />
      </div>
    </div>
  );
}
