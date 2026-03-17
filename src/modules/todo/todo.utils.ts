import { and, gt, gte, isNotNull, isNull, lt, lte, SQL } from 'drizzle-orm';
import { todos } from '../db/schemas/todos/todos';
import { TODO_STATUS, TodoStatus } from './dto/todo-query.dto';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

export type TodoDateBoundaries = {
  now: string;
  startOfToday: string;
  endOfToday: string;
};

export function getTodayBoundaries(timezone = 'Africa/Cairo'): TodoDateBoundaries {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);

  return {
    now: now.toISOString(),
    startOfToday: fromZonedTime(startOfDay(zonedNow), timezone).toISOString(),
    endOfToday: fromZonedTime(endOfDay(zonedNow), timezone).toISOString(),
  };
}

export function buildTodoStatusClause(
  status: TodoStatus | undefined,
  boundaries: TodoDateBoundaries,
): SQL | undefined {
  const { now, startOfToday, endOfToday } = boundaries;

  switch (status) {
    case TODO_STATUS.COMPLETED:
      return isNotNull(todos.doneAt);
    case TODO_STATUS.NO_DUE_DATE:
      return and(isNull(todos.dueDate), isNull(todos.doneAt));
    case TODO_STATUS.TODAY:
      return and(
        isNull(todos.doneAt),
        gte(todos.dueDate, startOfToday),
        lte(todos.dueDate, endOfToday),
      );
    case TODO_STATUS.INCOMING:
      return and(isNull(todos.doneAt), gt(todos.dueDate, endOfToday));
    case TODO_STATUS.MISSED:
      return and(isNull(todos.doneAt), lt(todos.dueDate, now));
    default:
      return undefined;
  }
}

export function resolveTodoStatus(
  todo: { dueDate: string | null; doneAt: string | null },
  boundaries: TodoDateBoundaries,
): TodoStatus {
  const { now, startOfToday, endOfToday } = boundaries;

  if (todo.doneAt) return TODO_STATUS.COMPLETED;
  if (!todo.dueDate) return TODO_STATUS.NO_DUE_DATE;
  if (todo.dueDate < startOfToday) return TODO_STATUS.MISSED;
  if (todo.dueDate >= startOfToday && todo.dueDate <= endOfToday) return TODO_STATUS.TODAY;
  if (todo.dueDate > endOfToday) return TODO_STATUS.INCOMING;

  return TODO_STATUS.MISSED;
}
