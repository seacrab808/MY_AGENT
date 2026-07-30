"use client";

import { useEffect, useMemo, useState } from "react";
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { eventDateKeys, fetchEventsForRange, filterEventsForTab, groupEventsByDate } from "@/lib/events";
import { toDateKey, todayIsMonday, currentWeekRange, KOREAN_WEEKDAY } from "@/lib/date";
import type { PlannerEvent } from "@/types/event";
import type { TabKey } from "@/lib/tabs";
import { Sidebar } from "@/components/Sidebar";
import { MonthlyTab } from "@/components/tabs/MonthlyTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { WeeklyTab } from "@/components/tabs/WeeklyTab";
import { DailyPlannerTab } from "@/components/tabs/DailyPlannerTab";
import { RoutinePresetTab } from "@/components/tabs/RoutinePresetTab";
import { GoalsTab } from "@/components/tabs/GoalsTab";
import { VocabQuizTab } from "@/components/tabs/VocabQuizTab";
import { TodayPopup } from "@/components/notifications/TodayPopup";
import { WeeklyPopup } from "@/components/notifications/WeeklyPopup";
import { PixelButton } from "@/components/ui/PixelButton";
import { HeroBanner } from "@/components/HeroBanner";
import { logout } from "@/app/actions";

interface DashboardProps {
  userId: string;
  userEmail: string;
  initialEvents: PlannerEvent[];
  initialMonth: string; // ISO date within the initial month
}

export function Dashboard({ userId, userEmail, initialEvents, initialMonth }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("monthly");
  const [monthDate, setMonthDate] = useState(() => new Date(initialMonth));
  const [events, setEvents] = useState<PlannerEvent[]>(initialEvents);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const [weekEvents, setWeekEvents] = useState<PlannerEvent[]>([]);
  const today = useMemo(() => new Date(), []);
  const [todayPopupOpen, setTodayPopupOpen] = useState(true);
  const [weeklyPopupOpen, setWeeklyPopupOpen] = useState(() => todayIsMonday(today));

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const todayKey = toDateKey(today);
  const todayEvents = eventsByDate[todayKey] ?? [];

  useEffect(() => {
    const supabase = createClient();
    const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });

    fetchEventsForRange(supabase, toDateKey(gridStart), toDateKey(gridEnd)).then(setEvents);
  }, [monthDate]);

  useEffect(() => {
    if (!todayIsMonday(today)) return;
    const supabase = createClient();
    const { start, end } = currentWeekRange(today);
    fetchEventsForRange(supabase, start, end).then(setWeekEvents);
  }, [today]);

  const weekRange = currentWeekRange(today);

  function handleEventCreated(event: PlannerEvent) {
    setEvents((prev) => [...prev, event]);

    const dateKeys = eventDateKeys(event);
    const overlapsWeek = dateKeys.some((k) => k >= weekRange.start && k <= weekRange.end);
    const isWeekVisible = filterEventsForTab([event], "week").length > 0;
    if (overlapsWeek && isWeekVisible) {
      setWeekEvents((prev) => [...prev, event]);
    }
  }

  function handleEventUpdated(event: PlannerEvent) {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    setWeekEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
  }

  function handleEventDeleted(eventId: string) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setWeekEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  return (
    <div className="flex flex-col flex-1 max-w-7xl w-full mx-auto p-4 gap-4">
      <HeroBanner
        title="🌱 PIXEL PLANNER"
        subtitle="오늘도 퀘스트를 클리어해볼까요?"
        right={
          <>
            <span className="font-body text-xs text-pixel-ink/70 hidden sm:inline bg-white/60 border-2 border-pixel-border rounded-[6px] px-2 py-1">
              {userEmail}
            </span>
            <form action={logout}>
              <PixelButton type="submit" tone="ink" className="text-sm px-3 py-1.5">
                로그아웃
              </PixelButton>
            </form>
          </>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 items-start flex-1 min-w-0">
        <Sidebar active={activeTab} onChange={setActiveTab} />

        <div className="flex-1 min-w-0 w-full">
          {activeTab === "monthly" && (
            <MonthlyTab
              userId={userId}
              monthDate={monthDate}
              onMonthChange={setMonthDate}
              events={events}
              eventsByDate={eventsByDate}
              selectedDateKey={selectedDateKey}
              onSelectDate={setSelectedDateKey}
              onEventCreated={handleEventCreated}
              onEventUpdated={handleEventUpdated}
              onEventDeleted={handleEventDeleted}
              onEventDuplicated={handleEventCreated}
            />
          )}
          {/* Chat stays mounted across tab switches (unlike other tabs) so an
              in-flight reply and the conversation state survive navigating away
              and back, instead of resetting when the tab unmounts. */}
          <div className={activeTab === "chat" ? "" : "hidden"}>
            <ChatTab onEventCreated={handleEventCreated} />
          </div>
          {activeTab === "weekly" && <WeeklyTab userId={userId} />}
          {activeTab === "daily" && <DailyPlannerTab userId={userId} />}
          {activeTab === "routine_preset" && <RoutinePresetTab userId={userId} />}
          {activeTab === "goals" && <GoalsTab userId={userId} />}
          {activeTab === "vocab" && <VocabQuizTab userId={userId} />}
        </div>
      </div>

      <TodayPopup
        open={todayPopupOpen}
        onClose={() => setTodayPopupOpen(false)}
        todayLabel={`${format(today, "M/d")} ${KOREAN_WEEKDAY[today.getDay()]}요일`}
        events={todayEvents}
      />

      <WeeklyPopup
        open={weeklyPopupOpen}
        onClose={() => setWeeklyPopupOpen(false)}
        weekStart={new Date(weekRange.start)}
        weekEnd={new Date(weekRange.end)}
        events={weekEvents}
      />
    </div>
  );
}
