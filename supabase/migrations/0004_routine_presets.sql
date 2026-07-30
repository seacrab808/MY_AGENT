-- 마이그레이션: 요일별 하루 루틴 프리셋 (하루 루틴 탭)
-- Supabase 대시보드 > SQL Editor 에서 이 파일 하나만 그대로 실행하세요.

create table if not exists public.routine_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week integer not null, -- 0(일요일) ~ 6(토요일)
  period text not null, -- morning | afternoon | evening
  label text not null,
  created_at timestamptz not null default now()
);

create index if not exists routine_presets_user_dow_idx on public.routine_presets (user_id, day_of_week);

alter table public.routine_presets enable row level security;

create policy "routine_presets_owner_all" on public.routine_presets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
