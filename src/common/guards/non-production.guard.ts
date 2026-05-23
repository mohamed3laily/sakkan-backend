import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NonProductionGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('ENDPOINT_DISABLED_IN_PRODUCTION');
    }

    return true;
  }
}
