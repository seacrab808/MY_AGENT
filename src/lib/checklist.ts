interface CompletableItem {
  is_done: boolean;
  completed_at: string | null;
  created_at: string;
}

/**
 * 체크(완료)한 항목을 먼저 체크한 순서대로 맨 위에 모으고, 아직 체크 안 한 항목은 그 아래에
 * tieBreaker로 넘긴 순서(기본값: 등록한 순서/created_at)대로 배치한다.
 * "체크한 애들이 젤 위로, 먼저 체크한 애가 젤 위" 요청을 TodoList/GoalList/TodayRoutineList가
 * 공유하는 하나의 정렬 규칙으로 구현.
 */
export function sortByCompletion<T extends CompletableItem>(
  items: T[],
  tieBreaker: (a: T, b: T) => number = (a, b) => a.created_at.localeCompare(b.created_at),
): T[] {
  return [...items].sort((a, b) => {
    if (a.is_done !== b.is_done) return a.is_done ? -1 : 1;
    if (a.is_done) {
      return (a.completed_at ?? a.created_at).localeCompare(b.completed_at ?? b.created_at);
    }
    return tieBreaker(a, b);
  });
}
