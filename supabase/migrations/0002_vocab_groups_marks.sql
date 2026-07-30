-- 마이그레이션: 단어 카드 그룹(DAY1, DAY2...)과 별표/세모 두 가지 표시
-- Supabase 대시보드 > SQL Editor 에서 이 파일 하나만 그대로 실행하세요.
-- (schema.sql이나 과거 마이그레이션 파일은 절대 다시 수정하지 마세요.)

create table if not exists public.vocab_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists vocab_groups_user_idx on public.vocab_groups (user_id);

alter table public.vocab_groups enable row level security;

drop policy if exists "vocab_groups_owner_all" on public.vocab_groups;
create policy "vocab_groups_owner_all" on public.vocab_groups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.vocab_words
  add column if not exists group_id uuid references public.vocab_groups(id) on delete set null;
alter table public.vocab_words add column if not exists is_starred boolean not null default false;
alter table public.vocab_words add column if not exists is_triangled boolean not null default false;

create index if not exists vocab_words_group_idx on public.vocab_words (group_id);

-- 기존 "어려운 단어" 표시를 별표로 이전한 뒤, 단일 플래그였던 컬럼은 정리
-- (컬럼이 이미 없으면 건너뜀 -> 이 파일을 다시 실행해도 에러 없음)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vocab_words' and column_name = 'is_difficult'
  ) then
    update public.vocab_words set is_starred = true where is_difficult = true;
    alter table public.vocab_words drop column is_difficult;
  end if;
end $$;
