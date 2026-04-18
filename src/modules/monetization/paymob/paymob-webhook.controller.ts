import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import type { PaymobWebhookPayload } from '../types';
import { PaymobService } from './paymob.service';
import { PaymobWebhookService } from './paymob-webhook.service';

@Controller('payments')
export class PaymobWebhookController {
  private readonly logger = new Logger(PaymobWebhookController.name);

  constructor(
    private readonly webhookService: PaymobWebhookService,
    private readonly paymobService: PaymobService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Server-side transaction processed callback (POST JSON + `hmac` query param).
   */
  @Post('paymob-webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: PaymobWebhookPayload, @Query('hmac') hmac: string) {
    const hmacStr = hmac ?? '';
    this.logger.log(
      `Paymob webhook received: type=${payload.type} txn=${payload.obj?.id} order=${payload.obj?.order?.id} integration=${payload.obj?.integration_id} hmacQuery=${hmacStr ? `present(len=${hmacStr.length})` : 'MISSING'} hasObj=${Boolean(payload.obj)}`,
    );

    await this.webhookService.handleWebhook(payload, hmacStr);

    return { received: true };
  }

  /**
   * Browser redirect after payment (GET query params + `hmac`). Verifies signature only; does not fulfill (POST webhook does).
   * Set `PAYMOB_FRONTEND_RETURN_URL` to redirect users to the app; otherwise returns JSON.
   */
  @Get('paymob-return')
  paymobReturn(
    @Query() query: Record<string, string | string[] | undefined>,
    @Res() res: Response,
  ): void {
    const hmacRaw = query['hmac'];
    const hmacLen =
      typeof hmacRaw === 'string' ? hmacRaw.length : Array.isArray(hmacRaw) ? hmacRaw[0]?.length ?? 0 : 0;
    this.logger.log(
      `Paymob return URL hit: hmac=${hmacLen ? `present(len=${hmacLen})` : 'MISSING'} queryKeys=${Object.keys(query).length}`,
    );
    if (!this.paymobService.verifyResponseCallbackHmac(query)) {
      throw new UnauthorizedException('INVALID_PAYMOB_HMAC');
    }

    const base = this.config.get<string>('PAYMOB_FRONTEND_RETURN_URL');
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (k === 'hmac') {
        continue;
      }
      const val = Array.isArray(v) ? v[0] : v;
      if (val !== undefined) {
        params.append(k, val);
      }
    }

    if (base) {
      const sep = base.includes('?') ? '&' : '?';
      res.redirect(302, `${base}${sep}${params.toString()}`);
      return;
    }

    const rawSuccess = query['success'];
    const successVal = Array.isArray(rawSuccess) ? rawSuccess[0] : rawSuccess;
    res.status(200).json({
      verified: true,
      success: String(successVal).toLowerCase() === 'true',
    });
  }
}
