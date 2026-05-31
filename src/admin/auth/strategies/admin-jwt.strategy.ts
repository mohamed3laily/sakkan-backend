import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { AdminJwtPayload } from '../interfaces/admin-jwt-payload.interface';
import { AuthRepo } from '../auth.repo';
import { AdminSessionService } from '../admin-session.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    configService: ConfigService,
    private authRepo: AuthRepo,
    private adminSessionService: AdminSessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('ADMIN_JWT_SECRET'),
    });
  }

  async validate(payload: AdminJwtPayload) {
    const admin = await this.authRepo.getById(payload.sub);
    if (!admin) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (admin.revokedAt) {
      throw new UnauthorizedException('ADMIN_REVOKED');
    }

    const sessionActive = await this.adminSessionService.isSessionActive(payload.sid);
    if (!sessionActive) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    return {
      id: admin.id,
      phone: admin.phone,
      name: admin.name,
      type: admin.type,
      sessionId: payload.sid,
    };
  }
}
