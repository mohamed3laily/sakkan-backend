import { Module } from '@nestjs/common';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { NoteRepo } from './note.repo';

@Module({
  controllers: [NoteController],
  providers: [NoteService, NoteRepo],
})
export class NoteModule {}
