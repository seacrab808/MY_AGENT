// 논문 노트 필드들이 순수 텍스트 대신 아주 제한된 리치 텍스트(볼드/하이라이트/줄바꿈)를 담게 되면서
// 필요해진 최소한의 HTML escape/sanitize 유틸. 외부 라이브러리 없이 브라우저 DOM API만으로 구현.

const ALLOWED_TAGS = new Set(["B", "STRONG", "MARK", "U", "EM", "I", "DIV", "P", "SPAN", "BR"]);
// 태그 자체뿐 아니라 안의 텍스트(예: <script>alert(1)</script>의 "alert(1)")까지 통째로 버려야 하는 것들 —
// 그 외 허용되지 않는 태그는 태그만 벗기고 자식은 살리지만(unwrap), 이것들은 자식까지 전부 버림(drop).
const DROP_ENTIRELY_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "NOSCRIPT"]);

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// DB에 저장된 값이 이 기능 이전의 순수 텍스트였을 수도, 이미 이 기능으로 저장된 HTML이었을 수도 있어서
// "<" 포함 여부로 대충 구분함 — 우리가 저장하는 HTML은 항상 sanitizeHtml을 거치므로 신뢰 가능,
// "<"가 없는 옛 순수 텍스트는 그대로 넣으면 태그로 오인식될 수 있는 문자만 escape하고 줄바꿈만 <br>로 치환.
export function plainValueToEditableHtml(value: string): string {
  if (value.includes("<")) return value;
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function sanitizeChildNode(node: ChildNode): Node[] {
  if (node.nodeType === Node.TEXT_NODE) return [node.cloneNode()];
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as HTMLElement;
  if (DROP_ENTIRELY_TAGS.has(el.tagName)) return [];
  const cleanChildren = Array.from(el.childNodes).flatMap((child) => sanitizeChildNode(child));
  if (!ALLOWED_TAGS.has(el.tagName)) return cleanChildren;
  const clean = document.createElement(el.tagName);
  // 배경색(하이라이트)만 허용 — 그 외 스타일/클래스/on* 속성 등은 전부 버림.
  if (el.tagName === "MARK" || el.tagName === "SPAN") {
    const bg = el.style.backgroundColor;
    if (bg) clean.style.backgroundColor = bg;
  }
  cleanChildren.forEach((child) => clean.appendChild(child));
  return [clean];
}

// contentEditable에서 나온 innerHTML(붙여넣기로 임의 마크업이 섞여 들어올 수 있음)을
// b/strong/mark/u/em/i/div/p/span(배경색만)/br로만 구성된 안전한 HTML로 정리해서 반환.
export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const container = document.createElement("div");
  container.innerHTML = html;
  const cleanNodes = Array.from(container.childNodes).flatMap((child) => sanitizeChildNode(child));
  const out = document.createElement("div");
  cleanNodes.forEach((n) => out.appendChild(n));
  return out.innerHTML;
}

export function isHtmlEmpty(html: string): boolean {
  if (typeof document === "undefined") return html.trim() === "";
  const container = document.createElement("div");
  container.innerHTML = html;
  return (container.textContent ?? "").trim() === "";
}
