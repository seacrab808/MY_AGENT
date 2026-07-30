export interface EventAttachment {
  id: string;
  event_id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  width: number | null; // 이미지 표시 너비(px). 이미지가 아니면 null
  summary_text: string | null;
  created_at: string;
}
