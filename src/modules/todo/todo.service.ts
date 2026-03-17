import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoRepository } from './todo.repo';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoQueryDto } from './dto/todo-query.dto';
import { PaginationService } from 'src/common/services/pagination.service';

@Injectable()
export class TodoService {
  constructor(
    private readonly repo: TodoRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createTodo(userId: number, dto: CreateTodoDto) {
    return this.repo.create(userId, dto);
  }

  async getTodos(userId: number, query: TodoQueryDto) {
    const { page = 1, limit = 20 } = query;
    const { data, total } = await this.repo.findAll(userId, query);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getTodo(userId: number, todoId: number) {
    return this.repo.findOne(userId, todoId);
  }

  async toggleTodoDone(userId: number, todoId: number) {
    const todo = await this.repo.toggleDone(userId, todoId);
    if (!todo) throw new NotFoundException('TODO_NOT_FOUND');
    return todo;
  }

  async updateTodo(userId: number, todoId: number, dto: UpdateTodoDto) {
    const todo = await this.repo.update(userId, todoId, dto);
    if (!todo) throw new NotFoundException('TODO_NOT_FOUND');
    return todo;
  }

  async deleteTodo(userId: number, todoId: number) {
    const deleted = await this.repo.delete(userId, todoId);
    if (!deleted) throw new NotFoundException('TODO_NOT_FOUND');
    return { message: 'TODO_DELETED' };
  }
}
