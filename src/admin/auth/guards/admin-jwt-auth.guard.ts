import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('jwt') {}
