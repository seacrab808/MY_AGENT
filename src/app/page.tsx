import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { fetchEventsForRange } from "@/lib/events";
import { toDateKey } from "@/lib/date";
import { Dashboard } from "@/components/Dashboard";
import { PixelCard } from "@/components/ui/PixelCard";

export default async function Home() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <PixelCard className="max-w-md text-center">
          <p className="font-pixel text-xl mb-3">⚙️</p>
          <h1 className="font-cute text-2xl mb-2">설정이 필요해요</h1>
          <p className="font-body text-sm text-pixel-ink-soft">
            .env.local에 Supabase / Anthropic 키를 채워주세요. README.md의 설정 가이드를 참고해줘요.
          </p>
        </PixelCard>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const gridStart = startOfWeek(startOfMonth(now), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(now), { weekStartsOn: 0 });

  const initialEvents = await fetchEventsForRange(
    supabase,
    toDateKey(gridStart),
    toDateKey(gridEnd),
  );

  const displayName =
    typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null;

  return (
    <Dashboard
      userId={user.id}
      userEmail={user.email ?? ""}
      initialDisplayName={displayName}
      initialEvents={initialEvents}
      initialMonth={toDateKey(startOfMonth(now))}
    />
  );
}
