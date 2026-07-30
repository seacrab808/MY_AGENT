-- 마이그레이션: 사용자별 설정(현재는 GitHub 아이디만) 저장용 테이블
-- Supabase 대시보드 > SQL Editor 에서 이 파일 하나만 그대로 실행하세요.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  github_username text,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_owner_all" on public.user_settings;
create policy "user_settings_owner_all" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
