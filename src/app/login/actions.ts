"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed" || /email.*not.*confirmed/i.test(error.message)) {
      return {
        error:
          "이메일 인증이 아직 안 됐어요. 가입할 때 받은 확인 메일의 링크를 눌러주세요. (또는 Supabase 대시보드 > Authentication > Providers > Email에서 'Confirm email'을 꺼두면 바로 로그인돼요)",
      };
    }
    if (error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message)) {
      return {
        error:
          "이메일 또는 비밀번호가 맞지 않아요. 인증 전에 같은 이메일로 재가입을 시도했다면 Supabase가 처음 입력한 비밀번호를 그대로 유지했을 수 있어요 — Supabase 대시보드 > Authentication > Users에서 계정을 지우고 다시 가입해보세요.",
      };
    }
    return { error: `로그인 실패: ${error.message}` };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 해요." };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: `가입 실패: ${error.message}` };
  }

  if (!data.session) {
    return {
      error:
        "가입 완료! 다만 이메일 인증이 필요해요. 받은 메일함(스팸함도 확인)에서 확인 링크를 눌러주세요. 지금 바로 쓰고 싶다면 Supabase 대시보드 > Authentication > Providers > Email에서 'Confirm email'을 꺼두면 인증 없이 바로 로그인돼요.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
