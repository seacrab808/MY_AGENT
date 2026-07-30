-- 마이그레이션: 오늘의 일기에 기분(이모지) 필드 추가 + 이달의 회고 테이블
-- Supabase 대시보드 > SQL Editor 에서 이 파일 하나만 그대로 실행하세요.

alter table public.diary_entries add column if not exists mood text;

create table if not exists public.retrospectives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_key text not null, -- monthKey() 형식, 'yyyy-MM'
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, period_key)
);

alter table public.retrospectives enable row level security;

drop policy if exists "retrospectives_owner_all" on public.retrospectives;
create policy "retrospectives_owner_all" on public.retrospectives
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
