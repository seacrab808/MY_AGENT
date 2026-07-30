import { NextRequest, NextResponse } from "next/server";

// GitHub의 실제 히트맵 HTML을 긁어오는 대신(마크업이 자주 바뀌어 깨지기 쉬움), 그 데이터를 그대로
// JSON(day별 count/level 0~4)으로 내려주는 공개 서드파티 API를 대신 프록시함. 클라이언트에서 직접
// 호출하지 않고 서버를 거치는 이유는 CORS 걱정 없이, 실패 응답을 우리 쪽 포맷으로 통일하기 위함.
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "username이 필요해요." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "GitHub 잔디를 불러오지 못했어요. 아이디를 확인해주세요." },
        { status: res.status === 404 ? 404 : 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch (err) {
    console.error("Failed to fetch GitHub contributions:", err);
    return NextResponse.json({ error: "GitHub 잔디를 불러오지 못했어요." }, { status: 502 });
  }
}
