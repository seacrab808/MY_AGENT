-- 마이그레이션: 하루짜리 일정도 캘린더에 "바" 형태로 표시할 수 있는 옵션
-- Supabase 대시보드 > SQL Editor 에서 이 파일 하나만 그대로 실행하세요.
-- (schema.sql이나 과거 마이그레이션 파일은 절대 다시 수정하지 마세요.)

-- 여러 날짜에 걸친 일정(event_end_date가 있는 경우)은 이미 월간 캘린더에서 바 형태로 표시됨.
-- 이 컬럼은 하루짜리 일정도 여행처럼 바 형태로 강제 표시하고 싶을 때 켜는 옵션.
-- true인 일정은 일일 플래너의 O/세모/X 완료 체크 UI를 표시하지 않고 일반 일정으로만 노출됨.
alter table public.events add column if not exists display_as_bar boolean not null default false;
