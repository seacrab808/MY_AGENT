import { NextRequest, NextResponse } from "next/server";
import { FunctionCallingConfigMode, Type, type FunctionDeclaration } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";
import { toDateKey } from "@/lib/date";
import { computeEndTime, computeVisibility } from "@/lib/events";
import type { EventCategory } from "@/types/event";
import type { RoutinePeriod } from "@/types/routine";

const CREATE_EVENT_FUNCTION: FunctionDeclaration = {
  name: "create_event",
  description:
    "사용자 메시지에 캘린더에 등록할 구체적인 일정(약속, 시험, 마감, 미팅, 여행 등)이 언급되어 있을 때 호출합니다. 단순 질문/인사/잡담에는 호출하지 마세요.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "일정 제목 (간결하게)" },
      event_date: {
        type: Type.STRING,
        description:
          "YYYY-MM-DD 형식의 시작 날짜. 상대 표현(내일, 다음주 월요일 등)은 오늘 날짜 기준으로 절대 날짜로 변환.",
      },
      event_end_date: {
        type: Type.STRING,
        description:
          "여행처럼 여러 날에 걸친 일정일 때만 YYYY-MM-DD 형식의 마지막 날짜. 단일 날짜 일정이면 빈 문자열.",
      },
      event_time: {
        type: Type.STRING,
        description: "HH:MM(24시간제) 형식의 시작 시간. 언급이 없으면 빈 문자열.",
      },
      end_time: {
        type: Type.STRING,
        description:
          "HH:MM(24시간제) 형식의 종료 시간. '5시부터 9시까지'처럼 명시적으로 끝나는 시간이 언급된 경우에만 채우고, 없으면 빈 문자열.",
      },
      description: {
        type: Type.STRING,
        description: "추가 메모/설명. 없으면 빈 문자열.",
      },
      category: {
        type: Type.STRING,
        enum: ["general", "dday", "exam", "meeting"],
        description: "general(일반), dday(디데이/마감), exam(시험), meeting(미팅/약속/세미나) 중 하나",
      },
    },
    required: ["title", "event_date"],
  },
};

const CREATE_ROUTINE_PRESET_FUNCTION: FunctionDeclaration = {
  name: "create_routine_preset",
  description:
    "사용자가 특정 요일마다 반복되는 루틴(예: '월~금 오전 루틴에 스트레칭 추가해줘', '매일 저녁 독서 루틴 추가') 등록을 요청할 때 호출합니다. " +
    "특정 날짜 하나에만 해당하는 일회성 일정에는 이 함수 대신 create_event를 사용하세요.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      label: { type: Type.STRING, description: "루틴 항목 내용 (간결하게)" },
      period: {
        type: Type.STRING,
        enum: ["morning", "afternoon", "evening"],
        description: "morning(오전), afternoon(오후), evening(퇴근 후/저녁) 중 하나",
      },
      days_of_week: {
        type: Type.ARRAY,
        items: { type: Type.INTEGER },
        description:
          "루틴을 반복할 요일 목록. 0=일요일, 1=월요일, ..., 6=토요일. " +
          "'월~금'이면 [1,2,3,4,5], '매일'이면 [0,1,2,3,4,5,6], '주말'이면 [0,6].",
      },
    },
    required: ["label", "period", "days_of_week"],
  },
};

const PERIOD_LABEL: Record<RoutinePeriod, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "퇴근 후",
};

const DOW_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "메시지가 비어있어요." }, { status: 400 });
  }

  const today = toDateKey(new Date());
  const gemini = getGeminiClient();

  let response;
  try {
    response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: `너는 사용자의 개인 일정 비서야. 오늘 날짜는 ${today}(KST) 이야. 사용자 메시지를 보고 아래 두 함수 중 하나를 호출할지 판단해:
1. create_event: 특정 날짜(들)에 해당하는 구체적인 일정(약속, 시험, 마감, 미팅, 여행 등)을 등록해달라는 요청. 상대적인 날짜 표현은 오늘 기준으로 절대 날짜로 변환해줘. "8월 23일~24일 여행"처럼 여러 날에 걸친 일정은 event_end_date에 마지막 날짜를 채우고, 하루짜리 일정이면 event_end_date는 비워둬. "5시부터 9시까지"처럼 종료 시간이 명시된 경우에만 end_time을 채우고, 시작 시간만 언급됐으면 end_time은 비워둬(자동으로 기본 시간만큼 적용돼).
2. create_routine_preset: "월~금 오전 루틴", "매일 아침", "주말마다" 처럼 특정 요일마다 반복되는 루틴을 등록해달라는 요청. 메시지에 "루틴"이라는 단어가 있거나 반복되는 요일 패턴이 언급되면 이 함수를 사용하고, create_event를 사용하면 안 돼.
일정 등록/루틴 등록 요청이 아니라 질문이나 잡담이면 함수를 호출하지 말고 짧고 다정하게 한국어로 답변해.`,
        tools: [{ functionDeclarations: [CREATE_EVENT_FUNCTION, CREATE_ROUTINE_PRESET_FUNCTION] }],
        toolConfig: {
          functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
        },
      },
    });
  } catch (err) {
    // Log status/message explicitly: Gemini SDK errors often stringify to "[object Object]"
    // under plain console.error(err), which hides the actual cause (quota, retired model, etc.)
    const status = (err as { status?: number })?.status;
    const message = err instanceof Error ? err.message : String(err);
    console.error("Gemini generateContent failed", { status, message, model: GEMINI_MODEL });
    return NextResponse.json({ error: "AI 호출에 실패했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }

  const routineCall = response.functionCalls?.find((c) => c.name === "create_routine_preset");

  if (routineCall) {
    const routineInput = routineCall.args as {
      label: string;
      period: RoutinePeriod;
      days_of_week: number[];
    };

    const days = Array.isArray(routineInput.days_of_week)
      ? [...new Set(routineInput.days_of_week.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))]
      : [];

    if (days.length === 0 || !routineInput.label) {
      return NextResponse.json({
        reply: "어떤 요일에 반복할 루틴인지 잘 모르겠어요. 다시 말해줄래요?",
      });
    }

    const { data: presets, error: routineError } = await supabase
      .from("routine_presets")
      .insert(
        days.map((day_of_week) => ({
          user_id: user.id,
          day_of_week,
          period: routineInput.period,
          label: routineInput.label,
        })),
      )
      .select();

    if (routineError) {
      console.error(routineError);
      return NextResponse.json({ error: "루틴 저장에 실패했어요." }, { status: 500 });
    }

    const dowText = days
      .slice()
      .sort((a, b) => a - b)
      .map((d) => DOW_LABEL[d])
      .join("");
    const reply = `${dowText} ${PERIOD_LABEL[routineInput.period]} 루틴에 '${routineInput.label}' 추가했어요! 🔄`;

    return NextResponse.json({ reply, routinePresets: presets });
  }

  const call = response.functionCalls?.find((c) => c.name === "create_event");

  if (!call) {
    return NextResponse.json({
      reply: response.text ?? "무슨 말인지 잘 못 알아들었어요. 다시 말해줄래요?",
    });
  }

  const input = call.args as {
    title: string;
    event_date: string;
    event_end_date?: string;
    event_time?: string;
    end_time?: string;
    description?: string;
    category?: EventCategory;
  };

  const category = input.category ?? "general";
  const eventEndDate = input.event_end_date && input.event_end_date !== input.event_date ? input.event_end_date : null;
  const eventTime = input.event_time ? input.event_time : null;
  const visibility = computeVisibility({
    event_date: input.event_date,
    event_end_date: eventEndDate,
    event_time: eventTime,
  });

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      title: input.title,
      event_date: input.event_date,
      event_end_date: eventEndDate,
      event_time: eventTime,
      end_time: computeEndTime(eventTime, category, input.end_time || null),
      description: input.description ? input.description : null,
      category,
      visibility,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "일정 저장에 실패했어요." }, { status: 500 });
  }

  const datePart = eventEndDate ? `${input.event_date}~${eventEndDate}` : input.event_date;
  const timePart = eventTime ? ` ${eventTime}` : "";
  const reply = `${datePart}${timePart}에 '${input.title}' 일정 등록했어요! 📌`;

  return NextResponse.json({ reply, event });
}
