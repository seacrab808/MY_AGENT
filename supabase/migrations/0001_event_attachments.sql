-- 마이그레이션: 일정 첨부파일(사진/파일) 확장 컬럼 + Storage 버킷
-- Supabase 대시보드 > SQL Editor 에서 이 파일 하나만 그대로 실행하세요.
-- (supabase/schema.sql은 최초 1회용 베이스 스키마입니다. 이후 변경사항은
--  이 파일처럼 supabase/migrations/ 아래에 새 번호로 추가하고, 절대 과거
--  마이그레이션 파일이나 schema.sql을 다시 수정하지 마세요 - 이미 적용된
--  내용을 재실행하면 "already exists" 에러가 납니다.)

alter table public.attachments add column if not exists file_name text not null default '';
alter table public.attachments add column if not exists mime_type text;
alter table public.attachments add column if not exists width integer; -- 메모에 삽입된 이미지의 표시 너비(px). 이미지가 아니면 null

create index if not exists attachments_event_idx on public.attachments (event_id);

-- 첨부파일/이미지를 저장할 Storage 버킷과 폴더 단위 RLS
insert into storage.buckets (id, name, public)
values ('event-attachments', 'event-attachments', true)
on conflict (id) do nothing;

drop policy if exists "event_attachments_insert_own" on storage.objects;
create policy "event_attachments_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "event_attachments_select_own" on storage.objects;
create policy "event_attachments_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'event-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "event_attachments_delete_own" on storage.objects;
create policy "event_attachments_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
