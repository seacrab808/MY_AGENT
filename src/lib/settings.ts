import { SupabaseClient } from "@supabase/supabase-js";
import type { UserSettings } from "@/types/settings";

export async function fetchUserSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data as UserSettings | null;
}

export async function saveGithubUsername(
  supabase: SupabaseClient,
  userId: string,
  githubUsername: string | null,
): Promise<{ settings: UserSettings | null; error: string | null }> {
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, github_username: githubUsername, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error(error);
    return { settings: null, error: "저장에 실패했어요." };
  }
  return { settings: data as UserSettings, error: null };
}
