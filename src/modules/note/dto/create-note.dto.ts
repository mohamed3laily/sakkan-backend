import { IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
