# 픽셀 플래너 (Pixel Planner)

컴공 대학원생을 위한 나만의 하루/일주일 루틴 플래너 에이전트. 채팅으로 일정을 등록하고,
사이드바 탭으로 월간/주간/일일 플래너, 분기·연도 목표, 단어 카드 퀴즈까지 관리합니다.

## 기능

- **월간 캘린더**: 자연어 채팅으로 등록한 일정이 도트 마커로 표시, 날짜 클릭 시 팝업 + 월간 TODO
- **채팅창**: "8월 5일 15시에 논문 미팅"처럼 입력하면 Gemini가 날짜/시간/제목을 파싱해 자동 등록
- **주간 캘린더**: 7일 그리드 + 주간 TODO + 주간 목표
- **일일 플래너**(모트모트 스타일): 오전/오후/퇴근 후 루틴 체크리스트, 오늘 TODO, 오늘 일정, 일기
- **분기·연도 목표**: 분기별/연도별 목표와 TODO 관리
- **단어 카드 퀴즈**: 단어+뜻 등록, 어려운 단어 형광펜 표시, 개수 선택 후 랜덤 플립 카드 퀴즈
- **당일/주간 알림 팝업**: 앱을 열면 오늘 일정을, 월요일이면 이번 주 일정도 함께 팝업으로 안내
- PWA 지원으로 모바일 홈 화면에 앱처럼 설치 가능, PC는 부팅 시 자동 실행 가능

## 처음 설정하기

### 1. Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. `supabase/schema.sql` 내용을 프로젝트의 **SQL Editor**에 붙여넣고 실행 (테이블 + RLS 정책 생성)
3. **Authentication > Providers > Email**에서 "Confirm email"을 꺼두면 가입 즉시 로그인 가능 (1인용 개인 앱이라 편의상 추천)
4. **Settings > API**에서 `Project URL`과 `anon public` 키를 복사

### 2. Gemini API 키 발급

[aistudio.google.com/apikey](https://aistudio.google.com/apikey)에서 API 키를 발급받습니다.
(채팅 일정 파싱 기능에 사용. 무료 티어가 있고, 초과 사용량은 과금됩니다)

### 3. 환경변수 설정

`.env.local.example`을 복사해 `.env.local`을 만들고 값을 채워주세요.

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

### 4. 로컬 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속 후 회원가입 → 로그인하면 시작할 수 있어요.

## 배포 (Vercel)

1. 이 저장소를 GitHub에 올리고 [vercel.com](https://vercel.com)에서 Import
2. 위 3개 환경변수를 Vercel 프로젝트 설정에 동일하게 등록
3. 배포 완료 후 발급된 URL이 이후 PC 자동 실행 / 모바일 설치에 사용할 주소예요.

## PC 부팅 시 자동 실행

배포된 URL이 생기면 PowerShell에서 아래 스크립트를 실행하세요. Chrome/Edge를 앱 창(주소창 없는 독립 창) 모드로
열어주는 바로가기를 Windows 시작프로그램 폴더에 등록합니다.

```powershell
./scripts/create-startup-shortcut.ps1 -Url "https://your-app.vercel.app"
```

제거하려면:

```powershell
./scripts/remove-startup-shortcut.ps1
```

## 모바일에서 사용하기

배포된 URL을 모바일 브라우저(Chrome/Safari)로 열고 "홈 화면에 추가"를 선택하면 앱처럼 아이콘이 생기고
PC와 동일한 Supabase 계정으로 데이터가 동기화돼요.

## 기술 스택

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres/Auth/Storage) ·
Google Gemini API (`gemini-2.5-flash`, function-calling 기반 일정 파싱) · PWA (manifest + service worker)

## 프로젝트 구조

```
src/
  app/                 라우트 (홈, 로그인, /api/chat)
  components/
    ui/                픽셀 스타일 공용 컴포넌트 (버튼/카드/모달/뱃지/인풋)
    calendar/          월간 캘린더, 날짜 팝업, 일정 리스트
    tabs/               사이드바 탭별 화면 (월간/채팅/주간/일일/목표/단어퀴즈)
    todo/, goal/        범용 TODO/목표 리스트 컴포넌트
    routine/            루틴 체크리스트, 일기
    vocab/               단어 플립 카드, 단어 관리, 퀴즈
  lib/                  Supabase 클라이언트, 날짜/기간 키 유틸, 데이터 조회 함수
  types/                공용 타입 정의
supabase/schema.sql     DB 스키마 + RLS 정책
scripts/                 PC 자동 실행 바로가기 등록/제거 스크립트
```

## Phase 2 로드맵

- 채팅에 PDF 첨부 시 Gemini로 요약 → 일정 팝업에서 요약 확인
- D-day 전용 위젯
- Web Push 기반 실시간 알림
