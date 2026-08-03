export interface TermConceptEntry {
  term: string;
  concept: string;
}

export interface PaperNoteFields {
  summary: string;
  background: TermConceptEntry[];
  prior_work: string;
  problem: string;
  evidence: string;
  why_overlooked: string;
  key_observation: string;
  sexy_idea: string;
  proposed_approach: string;
  technical_challenges: string;
  techniques: string;
  evaluation_logic: string;
  key_results: string;
  novelty_defense: string;
  why_toptier: string;
  lessons_learned: string;
}

export interface Paper {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  notes: PaperNoteFields;
  created_at: string;
  updated_at: string;
}
