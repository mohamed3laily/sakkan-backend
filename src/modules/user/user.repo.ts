import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users } from '../db/schemas/schema-index';
import { DrizzleService } from '../db/drizzle.service';

@Injectable()
export class UserRepo {
  constructor(private drizzleService: DrizzleService) {}

  async getUserById(id: number) {
    return this.drizzleService.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }
}
