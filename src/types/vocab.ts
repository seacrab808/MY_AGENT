export interface VocabGroup {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface VocabWord {
  id: string;
  user_id: string;
  group_id: string | null;
  term: string;
  meaning: string;
  is_starred: boolean;
  is_triangled: boolean;
  created_at: string;
}
