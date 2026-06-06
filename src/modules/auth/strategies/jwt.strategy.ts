import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserService } from 'src/modules/user/user.service';
import { Reflector } from '@nestjs/core';
import { ALLOW_UNVERIFIED_KEY } from '../decorators/allow-unverified.decorator';
import { UserSessionService } from '../user-session.service';
import {
  createSessionAuthException,
  toPublicRevokeCode,
} from '../session-auth-codes';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private reflector: Reflector,
    private userSessionService: UserSessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const user = await this.userService.getUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    const sessionStatus = await this.userSessionService.getSessionStatus(payload.sid);
    if (!sessionStatus.active) {
      if (sessionStatus.expired) {
        throw createSessionAuthException('SESSION_EXPIRED');
      }
      const code = toPublicRevokeCode(sessionStatus.reason);
      throw createSessionAuthException(code);
    }

    const allowUnverified = this.reflector.get<boolean>(
      ALLOW_UNVERIFIED_KEY,
      req.route?.stack?.[0]?.handle,
    );

    if (!user.verifiedPhoneAt && !allowUnverified) {
      throw new ForbiddenException({
        message: 'PHONE_NOT_VERIFIED',
        code: 'PHONE_NOT_VERIFIED',
      });
    }

    return {
      id: user.id,
      phone: user.phone,
      verified: !!user.verifiedPhoneAt,
      sessionId: payload.sid,
    };
  }
}
