"use client";

import { useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { plainValueToEditableHtml, sanitizeHtml } from "@/lib/richText";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  minHeightClassName?: string;
}

const HIGHLIGHT_COLOR = "#fff59d";
// 타이핑 중 한 글자마다 undo 스텝을 쌓으면 Ctrl+Z 한 번에 글자 하나씩만 지워져서 실용성이 없음 —
// 이 시간 동안 입력이 멈추면 그때까지의 타이핑을 "한 덩어리"로 묶어서 undo 스택에 커밋함(네이티브
// 브라우저 undo가 타이핑을 문장/단어 단위로 묶어주는 것과 비슷한 느낌).
const TYPING_COALESCE_MS = 600;

// 임의의 CSS color 문자열(hex/rgb/"transparent"/빈 문자열 등)을 브라우저가 실제로 계산한
// rgb(...)/rgba(...) 형태로 통일해서 비교 가능하게 만듦.
function normalizeColor(color: string): string {
  const probe = document.createElement("span");
  probe.style.backgroundColor = color || "transparent";
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).backgroundColor;
  document.body.removeChild(probe);
  return computed;
}

// contentEditable을 "제어 컴포넌트"로 만들면(매 입력마다 dangerouslySetInnerHTML을 새로 내려주면)
// 캐럿 위치가 튕기므로, 마운트 시 초기 HTML만 한 번 넣고 그 뒤로는 리액트가 이 div의 자식을
// 건드리지 않게 함(state에 담긴 initialHtml은 절대 갱신하지 않음 — PaperNoteForm이 이미 논문마다
// key={paper.id}로 폼 전체를 새로 마운트하므로, 논문을 바꾸면 이 컴포넌트도 함께 새로 만들어져
// 초기값 문제가 없음).
export function RichTextEditor({ value, onChange, placeholder, minHeightClassName = "min-h-[4.5rem]" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialHtml] = useState(() => plainValueToEditableHtml(value));
  // React 19 diffs `dangerouslySetInnerHTML` by object identity, not by the `__html` string inside
  // it (a documented regression: https://github.com/facebook/react/issues/31660) — a fresh `{ __html }`
  // object literal below would make React think the content "changed" on *every* render and force-reset
  // `innerHTML`, wiping whatever was just typed before the browser even finishes painting it (confirmed
  // live: every keystroke past the first got erased). `initialHtml` itself never changes after mount, so
  // memoizing on it gives a stable object reference React will actually skip re-applying.
  const dangerousHtml = useMemo(() => ({ __html: initialHtml }), [initialHtml]);
  const [isEmpty, setIsEmpty] = useState(() => value.trim() === "");

  // 우리만의 undo/redo 스택. 원래는 브라우저 자체 Ctrl+Z(execCommand 기반)에 맡기려 했지만, 실제로
  // Playwright로 확인해보니 타이핑은 undo가 되는데 bold/hiliteColor 같은 서식 명령은 브라우저의
  // undo 스택에 전혀 올라가지 않음(크로미움에서도 그러함) — 그래서 하이라이트를 적용한 뒤 Ctrl+Z를
  // 눌러도 아무 반응이 없던 것("ctrl z도 안 먹혀" 증상). 브라우저 undo를 신뢰할 수 없으니 타이핑과
  // 서식 적용 둘 다 이 스택 하나로 직접 관리함 — past: 되돌아갈 수 있는 과거 HTML들, future: redo용.
  const pastRef = useRef<string[]>([]);
  const futureRef = useRef<string[]>([]);
  // 타이핑 중간에는 커밋하지 않고, 이 타이핑 덩어리가 시작되기 "직전" 상태만 잠깐 들고 있다가
  // TYPING_COALESCE_MS만큼 조용해지면 그제서야 past에 한 번 커밋함.
  const pendingBeforeRef = useRef<string | null>(null);
  const coalesceTimerRef = useRef<number | null>(null);
  // document.execCommand(...)이 DOM을 바꾸면 브라우저가 진짜 키 입력처럼 'input' 이벤트를 한 번 더
  // 발생시킴 — 이걸 그대로 handleTypingInput이 받아버리면 "명령 적용 직후 상태"를 "다음 타이핑
  // 시작 전 상태"로 잘못 캡처해서, 되돌리기 스택에 방금 만든 상태와 똑같은 항목이 중복으로 쌓이고
  // 결국 실제로 되돌려야 할 스냅샷 대신 그 중복 항목이 먼저 pop되어 "아무 변화도 없는 것처럼" 보이는
  // 버그로 이어짐(직접 재현해서 확인함). commitDiscreteChange가 실행되는 동안에는 이 플래그를 켜서
  // handleTypingInput이 자체 커밋 로직을 건드리지 않고 화면 동기화만 하도록 막음.
  const isApplyingCommandRef = useRef(false);

  function captureBeforeChange() {
    if (pendingBeforeRef.current === null && editorRef.current) {
      pendingBeforeRef.current = editorRef.current.innerHTML;
    }
  }

  function commitPending() {
    if (coalesceTimerRef.current !== null) {
      window.clearTimeout(coalesceTimerRef.current);
      coalesceTimerRef.current = null;
    }
    if (pendingBeforeRef.current !== null) {
      pastRef.current.push(pendingBeforeRef.current);
      pendingBeforeRef.current = null;
      futureRef.current = [];
    }
  }

  function syncChange() {
    const el = editorRef.current;
    if (!el) return;
    onChange(sanitizeHtml(el.innerHTML));
    setIsEmpty((el.textContent ?? "").trim() === "");
  }

  // 타이핑(키 입력)에서만 호출 — 서식 버튼 클릭 등 한 번에 끝나는 동작은 commitDiscreteChange를 씀.
  function handleTypingInput() {
    if (isApplyingCommandRef.current) {
      // execCommand가 유발한 'input' 이벤트 — commitDiscreteChange가 이미 undo 스텝을 알아서
      // 쌓으므로 여기선 화면 동기화만 하고 타이핑 커밋 로직은 건드리지 않음.
      syncChange();
      return;
    }
    captureBeforeChange();
    syncChange();
    if (coalesceTimerRef.current !== null) window.clearTimeout(coalesceTimerRef.current);
    coalesceTimerRef.current = window.setTimeout(commitPending, TYPING_COALESCE_MS);
  }

  // 서식 적용처럼 "누르면 즉시 끝나는" 동작 전용 — 진행 중이던 타이핑 덩어리를 먼저 하나의 undo
  // 스텝으로 확정한 뒤, 이 동작만을 위한 새 undo 스텝을 그 위에 쌓음(타이핑 → 하이라이트 → Ctrl+Z를
  // 누르면 하이라이트만 풀리고 타이핑한 글자는 남아있어야 하므로 서로 다른 스텝이어야 함).
  function commitDiscreteChange(run: () => void) {
    commitPending();
    const el = editorRef.current;
    if (!el) return;
    pastRef.current.push(el.innerHTML);
    futureRef.current = [];
    isApplyingCommandRef.current = true;
    run();
    isApplyingCommandRef.current = false;
    syncChange();
  }

  function restoreHtml(html: string) {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = html;
    el.focus();
    // 커서를 항상 맨 끝으로 — undo/redo가 어디를 바꿨는지와 무관하게 최소한 편집을 계속 이어갈 수
    // 있는 위치에 두기 위함(정확한 원래 캐럿 위치 복원은 하지 않음, 실용적 타협).
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    syncChange();
  }

  function undo() {
    commitPending();
    const el = editorRef.current;
    if (!el || pastRef.current.length === 0) return;
    const prev = pastRef.current.pop()!;
    futureRef.current.push(el.innerHTML);
    restoreHtml(prev);
  }

  function redo() {
    const el = editorRef.current;
    if (!el || futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    pastRef.current.push(el.innerHTML);
    restoreHtml(next);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }
    // 'input' 이벤트는 브라우저가 이미 글자를 넣은 "다음"에야 발생해서, 거기서 캡처하면 그 타이핑
    // 덩어리의 첫 글자가 이미 반영된 상태를 "덩어리 시작 전" 상태로 잘못 기록하게 됨(실제로 재현:
    // Ctrl+Z가 방금 친 글자 중 하나를 남겨두고 되돌림). 그래서 실제 DOM이 바뀌기 전인 keydown
    // 시점에서 미리 캡처함. Ctrl 조합(Ctrl+A/C/V 등)은 이 시점에 캡처할 필요가 없고, 붙여넣기는
    // onPaste에서 별도로 commitDiscreteChange를 거침.
    if (!e.ctrlKey && !e.metaKey) {
      captureBeforeChange();
    }
  }

  function applyBold() {
    commitDiscreteChange(() => {
      editorRef.current?.focus();
      document.execCommand("bold");
    });
  }

  // 선택 영역의 시작 지점이 이미 우리 하이라이트 색으로 감싸여 있는지, 조상을 타고 올라가며 직접
  // 확인함(document.queryCommandValue("hiliteColor")로도 시도해봤으나 실제 브라우저에서 이미
  // 하이라이트된 텍스트를 다시 선택했을 때도 빈 값을 돌려주는 경우가 있어 신뢰할 수 없었음 —
  // 실제 인라인 스타일을 직접 검사하는 쪽이 훨씬 안정적).
  function isSelectionHighlighted(selection: Selection): boolean {
    const editor = editorRef.current;
    if (!editor) return false;
    let node: Node | null = selection.anchorNode;
    while (node && node !== editor) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const bg = (node as HTMLElement).style.backgroundColor;
        if (bg && normalizeColor(bg) === normalizeColor(HIGHLIGHT_COLOR)) return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  // 하이라이트를 적용하는 방식 자체는 execCommand("hiliteColor", ...)를 씀(Range를 직접 조작해서
  // <mark>를 끼워넣던 예전 방식은 브라우저가 그 변화를 편집 명령으로 인식하지 못해 선택 영역 갱신 등
  // 여러 면에서 더 불안정했음) — 하지만 undo는 브라우저에 맡기지 않고 위 커스텀 스택으로 직접 관리.
  // 같은 버튼으로 켜고 끄는 토글도 지원: 이미 하이라이트된 선택 영역이면 transparent로 되돌림
  // ("하이라이트 했다가 취소도 되게").
  function applyHighlight() {
    const el = editorRef.current;
    const selection = window.getSelection();
    if (!el || !selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;
    const isHighlighted = isSelectionHighlighted(selection);
    commitDiscreteChange(() => {
      el.focus();
      document.execCommand("hiliteColor", false, isHighlighted ? "transparent" : HIGHLIGHT_COLOR);
    });
  }

  function clearFormatting() {
    commitDiscreteChange(() => {
      editorRef.current?.focus();
      document.execCommand("removeFormat");
    });
  }

  // 붙여넣기를 그대로 허용하면 브라우저가 클립보드의 HTML을 바로 파싱/삽입하는데, 그 안에
  // <img onerror=...>같은 게 있으면 sanitizeHtml이 개입하기도 전에(=onInput 핸들러가 실행되기 전에)
  // 즉시 실행돼버림(직접 확인함: 그런 페이로드를 붙여넣었을 때 우리 쪽 필터링과 무관하게 먼저 실행됨).
  // 그래서 붙여넣기는 항상 서식 없는 텍스트로만 받고, 굵게/하이라이트는 이 에디터의 버튼으로만 적용함.
  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    commitDiscreteChange(() => {
      document.execCommand("insertText", false, text);
    });
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
          title="하이라이트 (선택한 텍스트에 적용, 다시 누르면 해제)"
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
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={undo}
          title="되돌리기 (Ctrl+Z)"
          className="font-body text-[10px] text-pixel-ink-soft px-2 h-[26px] flex items-center justify-center border-2 border-pixel-border rounded-full bg-pixel-panel active:scale-95 cursor-pointer transition-transform"
        >
          ↺ 되돌리기
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
          onInput={handleTypingInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          dangerouslySetInnerHTML={dangerousHtml}
          className={`${minHeightClassName} w-full font-body text-sm px-3 py-2 border-2 border-pixel-border rounded-[12px] bg-pixel-bg text-pixel-ink shadow-[inset_0_1px_3px_rgba(120,90,70,0.08)] focus:outline-none focus:ring-2 focus:ring-pixel-purple whitespace-pre-wrap break-words [&_mark]:rounded-[2px] [&_mark]:px-0.5 [&_span]:rounded-[2px] [&_span]:px-0.5`}
        />
      </div>
    </div>
  );
}
