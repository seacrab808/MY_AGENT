import type { PaperNoteFields, TermConceptEntry } from "@/types/paper";

export interface PaperNoteFieldDef {
  key: keyof PaperNoteFields;
  no: number;
  label: string;
  question: string;
  // 이 필드부터 새 섹션이 시작됨을 표시하는 헤더 텍스트(폼/인쇄뷰에서 구분선 겸 소제목으로 사용).
  section?: string;
  // "terms"면 배경지식처럼 {term, concept} 쌍을 여러 개 추가하는 리스트 UI, 기본(text)이면 textarea.
  type?: "text" | "terms";
}

// 사용자가 준 16개 항목 표(#, 항목, 핵심 질문) 그대로 — 탑티어 논문 판단 기준(정곡을 찌르는 문제
// 발견 + 왜 지금까지 못 봤는지 설명 + 재밌는 아이디어)을 순서대로 채워나가는 체크리스트.
// section은 폼을 5단계 흐름(이해→문제 발견→아이디어→검증→총평)으로 묶어 보여주기 위한 소제목.
export const PAPER_NOTE_FIELDS: PaperNoteFieldDef[] = [
  {
    key: "summary",
    no: 1,
    label: "한 줄 요약",
    question: "이 논문을 딱 한 문장으로 설명하면?",
    section: "① 이해하기",
  },
  {
    key: "background",
    no: 2,
    label: "배경 지식",
    question: "이 논문을 이해하려면 뭘 알아야 하나? 용어 하나당 개념 하나씩 추가해보세요.",
    type: "terms",
  },
  {
    key: "prior_work",
    no: 3,
    label: "기존 연구의 세계관",
    question: "기존 연구들은 문제를 어떻게 생각했나?",
  },
  {
    key: "problem",
    no: 4,
    label: "Problem",
    question: "정확히 무엇이 문제인가?",
    section: "② 문제 발견",
  },
  { key: "evidence", no: 5, label: "Evidence", question: "그게 진짜 문제라는 증거는?" },
  {
    key: "why_overlooked",
    no: 6,
    label: "Why overlooked?",
    question: "왜 지금까지 사람들이 이걸 못 봤나?",
  },
  {
    key: "key_observation",
    no: 7,
    label: "Key Observation",
    question: "저자들이 새롭게 발견한 현상은?",
  },
  {
    key: "sexy_idea",
    no: 8,
    label: "Sexy Idea / Aha!",
    question: "이 논문의 가장 재밌는 발상은?",
    section: "③ 아이디어와 제안",
  },
  { key: "proposed_approach", no: 9, label: "Proposed Approach", question: "그래서 무엇을 제안했나?" },
  {
    key: "technical_challenges",
    no: 10,
    label: "Technical Challenges",
    question: "그 아이디어를 실제 구현하면 뭐가 어려운가?",
  },
  { key: "techniques", no: 11, label: "Techniques", question: "각 challenge를 어떻게 해결했나?" },
  {
    key: "evaluation_logic",
    no: 12,
    label: "Evaluation Logic",
    question: "어떤 주장에 어떤 실험을 붙였나?",
    section: "④ 검증",
  },
  { key: "key_results", no: 13, label: "Key Results", question: "그래서 얼마나 좋아졌나?" },
  {
    key: "novelty_defense",
    no: 14,
    label: "Novelty Attack & Defense",
    question: "이거 그냥 기존 XXX 아닌가?에 어떻게 답하나?",
    section: "⑤ 총평",
  },
  {
    key: "why_toptier",
    no: 15,
    label: "Why Top-tier?",
    question: "그래서 왜 이 논문이 탑티어급인가?",
  },
  {
    key: "lessons_learned",
    no: 16,
    label: "배울 점, 깨달은 점",
    question: "이 논문을 읽으며 새로 배우거나 깨달은 점은?",
  },
];

export function emptyPaperNotes(): PaperNoteFields {
  const result: Record<string, unknown> = {};
  for (const field of PAPER_NOTE_FIELDS) {
    result[field.key] = field.type === "terms" ? [] : "";
  }
  return result as unknown as PaperNoteFields;
}

function normalizeTermConceptList(raw: unknown): TermConceptEntry[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const e = entry as Record<string, unknown>;
      return [
        {
          term: typeof e.term === "string" ? e.term : "",
          concept: typeof e.concept === "string" ? e.concept : "",
        },
      ];
    });
  }
  // 옛 데이터: background가 textarea 문자열 하나였던 논문 — 유실 없이 한 항목으로 이전.
  if (typeof raw === "string" && raw.trim()) {
    return [{ term: "", concept: raw }];
  }
  return [];
}

// DB에서 온 notes가 옛 논문(필드 추가 전)이거나 일부 키가 비어있을 수 있으니, 항상 16개 키가
// 다 채워진(빈 값이라도) 객체로 정규화. jsonb라 타입 보장이 없어서 방어적으로 처리.
export function normalizePaperNotes(raw: unknown): PaperNoteFields {
  const source = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}) ?? {};
  const result: Record<string, unknown> = {};
  for (const field of PAPER_NOTE_FIELDS) {
    if (field.type === "terms") {
      result[field.key] = normalizeTermConceptList(source[field.key]);
    } else {
      const value = source[field.key];
      result[field.key] = typeof value === "string" ? value : "";
    }
  }
  return result as unknown as PaperNoteFields;
}
