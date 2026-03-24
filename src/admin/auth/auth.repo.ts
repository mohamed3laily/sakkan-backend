import { Injectable } from '@nestjs/common';
import { admins } from 'src/modules/db/schemas/admins/admins';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/modules/db/drizzle.service';
import { AdminRegisterDto } from './dto/admin-register.dto';

@Injectable()
export class AuthRepo {
  constructor(private drizzleService: DrizzleService) {}

  async getByPhone(phone: string) {
    return this.drizzleService.db.query.admins.findFirst({
      where: eq(admins.phone, phone),
    });
  }

  async insert(registerDto: AdminRegisterDto, hashedPassword: string) {
    const { name, phone } = registerDto;
    return this.drizzleService.db
      .insert(admins)
      .values({
        name,
        phone,
        password: hashedPassword,
      })
      .returning()
      .then(([admin]) => admin);
  }
}
