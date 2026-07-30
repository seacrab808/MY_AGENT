-- 마이그레이션: 일일 플래너 "오늘의 일정" 드래그 순서 저장 + 체크 상태를 O/X 2단계로 정리
-- Supabase 대시보드 > SQL Editor 에서 이 파일 하나만 그대로 실행하세요.
-- (schema.sql이나 과거 마이그레이션 파일은 절대 다시 수정하지 마세요.)

alter table public.events add column if not exists sort_order integer;

-- 세모(triangle) 체크는 없어졌으므로, 혹시 남아있는 값이 있다면 미체크로 되돌림 (재실행해도 안전)
update public.events set check_status = null where check_status = 'triangle';
