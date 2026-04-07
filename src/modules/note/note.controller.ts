import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  async createNote(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateNoteDto) {
    return this.noteService.createNote(user.id, dto);
  }

  @Get()
  async getNotes(@CurrentUser() user: AuthenticatedUser, @Query() query: NoteQueryDto) {
    return this.noteService.getNotes(user.id, query);
  }

  @Get(':id')
  async getNote(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.noteService.getNote(user.id, id);
  }

  @Patch(':id')
  async updateNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.noteService.updateNote(user.id, id, dto);
  }

  @Delete(':id')
  async deleteNote(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.noteService.deleteNote(user.id, id);
  }
}
