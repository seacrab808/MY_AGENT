import { SupabaseClient } from "@supabase/supabase-js";
import type { EventAttachment } from "@/types/attachment";

const BUCKET = "event-attachments";
const DEFAULT_IMAGE_WIDTH = 280;

export function isImageMime(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}

export async function fetchAttachmentsForEvent(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventAttachment[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return data as EventAttachment[];
}

export function attachmentUrl(supabase: SupabaseClient, filePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadAttachment(
  supabase: SupabaseClient,
  params: { userId: string; eventId: string; file: File },
): Promise<{ attachment: EventAttachment | null; error: string | null }> {
  const { userId, eventId, file } = params;
  const safeName = file.name.replace(/[^\w.\-가-힣]/g, "_");
  const path = `${userId}/${eventId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
  });

  if (uploadError) {
    console.error(uploadError);
    return { attachment: null, error: "파일 업로드에 실패했어요." };
  }

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      event_id: eventId,
      user_id: userId,
      file_path: path,
      file_name: file.name,
      mime_type: file.type || null,
      width: isImageMime(file.type) ? DEFAULT_IMAGE_WIDTH : null,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return { attachment: null, error: "첨부파일 저장에 실패했어요." };
  }

  return { attachment: data as EventAttachment, error: null };
}

export async function deleteAttachment(
  supabase: SupabaseClient,
  attachment: EventAttachment,
): Promise<string | null> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([attachment.file_path]);
  if (storageError) {
    console.error(storageError);
  }

  const { error } = await supabase.from("attachments").delete().eq("id", attachment.id);
  if (error) {
    console.error(error);
    return "첨부파일 삭제에 실패했어요.";
  }
  return null;
}

export async function updateAttachmentWidth(
  supabase: SupabaseClient,
  id: string,
  width: number,
): Promise<void> {
  const { error } = await supabase.from("attachments").update({ width }).eq("id", id);
  if (error) console.error(error);
}
