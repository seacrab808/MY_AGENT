import { NextRequest, NextResponse } from "next/server";
import type OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/openai";
import { toDateKey } from "@/lib/date";
import type { EventCategory } from "@/types/event";

const CREATE_EVENT_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "create_event",
    description:
      "사용자 메시지에 캘린더에 등록할 구체적인 일정(약속, 시험, 마감, 미팅 등)이 언급되어 있을 때 호출합니다. 단순 질문/인사/잡담에는 호출하지 마세요.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "일정 제목 (간결하게)" },
        event_date: {
          type: "string",
          description:
            "YYYY-MM-DD 형식의 날짜. 상대 표현(내일, 다음주 월요일 등)은 오늘 날짜 기준으로 절대 날짜로 변환.",
        },
        event_time: {
          type: "string",
          description: "HH:MM(24시간제) 형식의 시간. 언급이 없으면 빈 문자열.",
        },
        description: {
          type: "string",
          description: "추가 메모/설명. 없으면 빈 문자열.",
        },
        category: {
          type: "string",
          enum: ["general", "dday", "exam", "meeting"],
          description: "general(일반), dday(디데이/마감), exam(시험), meeting(미팅/약속) 중 하나",
        },
      },
      required: ["title", "event_date"],
    },
  },
};

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
  const openai = getOpenAIClient();

  let response;
  try {
    response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `너는 사용자의 개인 일정 비서야. 오늘 날짜는 ${today}(KST) 이야. 사용자가 채팅으로 일정을 이야기하면 create_event 도구를 호출해서 날짜/시간/제목을 추출해. 상대적인 날짜 표현은 오늘 기준으로 절대 날짜로 변환해줘. 일정 등록 요청이 아니라 질문이나 잡담이면 도구를 호출하지 말고 짧고 다정하게 한국어로 답변해.`,
        },
        { role: "user", content: message },
      ],
      tools: [CREATE_EVENT_TOOL],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI 호출에 실패했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }

  const choice = response.choices[0]?.message;
  const toolCall = choice?.tool_calls?.find(
    (call): call is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall =>
      call.type === "function" && call.function.name === "create_event",
  );

  if (!toolCall) {
    return NextResponse.json({
      reply: choice?.content ?? "무슨 말인지 잘 못 알아들었어요. 다시 말해줄래요?",
    });
  }

  let input: {
    title: string;
    event_date: string;
    event_time?: string;
    description?: string;
    category?: EventCategory;
  };

  try {
    input = JSON.parse(toolCall.function.arguments);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요." }, { status: 502 });
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      title: input.title,
      event_date: input.event_date,
      event_time: input.event_time ? input.event_time : null,
      description: input.description ? input.description : null,
      category: input.category ?? "general",
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "일정 저장에 실패했어요." }, { status: 500 });
  }

  const timePart = input.event_time ? ` ${input.event_time}` : "";
  const reply = `${input.event_date}${timePart}에 '${input.title}' 일정 등록했어요! 📌`;

  return NextResponse.json({ reply, event });
}
