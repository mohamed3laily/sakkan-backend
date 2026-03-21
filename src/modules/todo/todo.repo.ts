import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../db/drizzle.service';
import { todos } from '../db/schemas/todos/todos';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoQueryDto } from './dto/todo-query.dto';
import { and, count, eq, ilike, sql } from 'drizzle-orm';
import { buildTodoStatusClause, getTodayBoundaries, resolveTodoStatus } from './todo.utils';

@Injectable()
export class TodoRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(userId: number, dto: CreateTodoDto) {
    const [todo] = await this.drizzleService.db
      .insert(todos)
      .values({
        title: dto.title,
        description: dto.description,
        userId,
        dueDate: dto.dueDate,
        remindMe: dto.remindMe,
      })
      .returning();
    const boundaries = getTodayBoundaries();
    return { ...todo, status: resolveTodoStatus(todo, boundaries) };
  }

  async findAll(userId: number, query: TodoQueryDto) {
    const { page = 1, limit = 20, status, search } = query;
    const offset = (page - 1) * limit;

    const boundaries = getTodayBoundaries();
    const whereClause = and(
      eq(todos.userId, userId),
      buildTodoStatusClause(status, boundaries),
      search ? ilike(todos.title, `%${search}%`) : undefined,
    );

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select()
        .from(todos)
        .where(whereClause)
        .orderBy(sql`${todos.dueDate} ASC NULLS LAST`)
        .limit(limit)
        .offset(offset),

      this.drizzleService.db.select({ total: count() }).from(todos).where(whereClause),
    ]);

    return {
      data: data.map((todo) => ({ ...todo, status: resolveTodoStatus(todo, boundaries) })),
      total: Number(total),
    };
  }

  async findOne(userId: number, todoId: number) {
    const boundaries = getTodayBoundaries();
    const [todo] = await this.drizzleService.db
      .select()
      .from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
      .limit(1);
    if (!todo) return null;
    return { ...todo, status: resolveTodoStatus(todo, boundaries) };
  }

  async toggleDone(userId: number, todoId: number) {
    const [current] = await this.drizzleService.db
      .select({ doneAt: todos.doneAt })
      .from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
      .limit(1);

    if (!current) return null;

    const [todo] = await this.drizzleService.db
      .update(todos)
      .set({ doneAt: current.doneAt ? null : new Date().toISOString() })
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
      .returning();

    const boundaries = getTodayBoundaries();
    return { ...todo, status: resolveTodoStatus(todo, boundaries) };
  }

  async update(userId: number, todoId: number, dto: UpdateTodoDto) {
    const [todo] = await this.drizzleService.db
      .update(todos)
      .set(dto)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
      .returning();
    if (!todo) return null;
    const boundaries = getTodayBoundaries();
    return { ...todo, status: resolveTodoStatus(todo, boundaries) };
  }

  async delete(userId: number, todoId: number) {
    const [todo] = await this.drizzleService.db
      .delete(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
      .returning();
    return todo ?? null;
  }
}
