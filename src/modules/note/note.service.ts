import { Injectable, NotFoundException } from '@nestjs/common';
import { NoteRepo } from './note.repo';
import { PaginationService } from 'src/common/services/pagination.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';

@Injectable()
export class NoteService {
  constructor(
    private readonly repo: NoteRepo,
    private readonly paginationService: PaginationService,
  ) {}

  async createNote(userId: number, dto: CreateNoteDto) {
    return this.repo.create(userId, dto);
  }

  async getNotes(userId: number, query: NoteQueryDto) {
    const { page = 1, limit = 20 } = query;
    const { data, total } = await this.repo.findAll(userId, query);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getNote(userId: number, noteId: number) {
    const note = await this.repo.findOne(userId, noteId);
    if (!note) throw new NotFoundException('NOTE_NOT_FOUND');
    return note;
  }

  async updateNote(userId: number, noteId: number, dto: UpdateNoteDto) {
    const note = await this.repo.update(userId, noteId, dto);
    if (!note) throw new NotFoundException('NOTE_NOT_FOUND');
    return note;
  }

  async deleteNote(userId: number, noteId: number) {
    const deleted = await this.repo.delete(userId, noteId);
    if (!deleted) throw new NotFoundException('NOTE_NOT_FOUND');
    return { message: 'NOTE_DELETED' };
  }
}
