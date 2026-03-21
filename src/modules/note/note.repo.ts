import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { notes } from '../db/schemas/notes/notes';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';

@Injectable()
export class NoteRepo {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(userId: number, dto: CreateNoteDto) {
    const [note] = await this.drizzleService.db
      .insert(notes)
      .values({ title: dto.title, description: dto.description, userId })
      .returning();
    return note;
  }

  async findAll(userId: number, query: NoteQueryDto) {
    const { page = 1, limit = 20, search } = query;
    const offset = (page - 1) * limit;

    const whereClause = and(
      eq(notes.userId, userId),
      search ? ilike(notes.title, `%${search}%`) : undefined,
    );

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select()
        .from(notes)
        .where(whereClause)
        .orderBy(desc(notes.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzleService.db.select({ total: count() }).from(notes).where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async findOne(userId: number, noteId: number) {
    const [note] = await this.drizzleService.db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .limit(1);
    return note ?? null;
  }

  async update(userId: number, noteId: number, dto: UpdateNoteDto) {
    const [note] = await this.drizzleService.db
      .update(notes)
      .set(dto)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();
    return note ?? null;
  }

  async delete(userId: number, noteId: number) {
    const [note] = await this.drizzleService.db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();
    return note ?? null;
  }
}
