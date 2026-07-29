export type TodoScope = "month" | "week" | "quarter" | "year" | "day";

export interface Todo {
  id: string;
  user_id: string;
  scope: TodoScope;
  period_key: string;
  title: string;
  is_done: boolean;
  created_at: string;
}

export type GoalScope = "week" | "quarter" | "year";

export interface Goal {
  id: string;
  user_id: string;
  scope: GoalScope;
  period_key: string;
  title: string;
  is_done: boolean;
  created_at: string;
}
