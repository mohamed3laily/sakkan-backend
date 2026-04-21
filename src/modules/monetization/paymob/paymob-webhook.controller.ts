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

import { paymobOrderIdFromTransactionObj } from './paymob-hmac.util';
import { PaymobService } from './paymob.service';
import { PaymobWebhookService } from './paymob-webhook.service';

/**
 * Paymob Accept callbacks (configure URLs on the integration in the dashboard).
 *
 * - **Transaction processed** (server-side): POST JSON body with `type` and `obj` (transaction details: `id`, `success`, `order.id`, etc.). Paymob appends **`hmac` as a query parameter** on the same request — verify with SHA-512 over the fixed field concatenation from `obj`, then compare to that `hmac` ([HMAC](https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac)).
 * - **Transaction response** (client redirect): GET with the same logical fields as flat query params plus `hmac` — for UX only; POST processed callback is the source of truth for fulfillment.
 *
 * @see https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/transaction-callbacks
 */
@Controller('payments')
export class PaymobWebhookController {
  private readonly logger = new Logger(PaymobWebhookController.name);

  constructor(
    private readonly webhookService: PaymobWebhookService,
    private readonly paymobService: PaymobService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Transaction **processed** callback: POST JSON + `?hmac=` (HMAC is in the query string, not only in the body).
   */
  @Post('paymob-webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: unknown, @Query('hmac') hmac: string) {
    const hmacStr = hmac ?? '';
    let orderLog = '?';
    let txnLog = '?';
    let intLog = '?';
    let typeLog = '?';
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const body = payload as Record<string, unknown>;
      typeLog = String(body['type'] ?? '?');
      const obj = body['obj'];
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const o = obj as Record<string, unknown>;
        txnLog = String(o['id'] ?? '?');
        intLog = String(o['integration_id'] ?? '?');
        orderLog = paymobOrderIdFromTransactionObj(o) ?? '?';
      }
    }
    this.logger.log(
      `Paymob webhook received: type=${typeLog} txn=${txnLog} order=${orderLog} integration=${intLog} hmacQuery=${hmacStr ? `present(len=${hmacStr.length})` : 'MISSING'}`,
    );

    await this.webhookService.handleWebhook(payload, hmacStr);

    return { received: true };
  }

  /**
   * Transaction **response** callback: GET query parameters (same keys as the processed callback `obj`, flattened) + `hmac`.
   * We only verify HMAC here for the redirect UX; subscription/credits fulfillment runs on the POST processed webhook.
   */
  @Get('paymob-return')
  paymobReturn(
    @Query() query: Record<string, string | string[] | undefined>,
    @Res() res: Response,
  ): void {
    const hmacRaw = query['hmac'];
    const hmacLen =
      typeof hmacRaw === 'string'
        ? hmacRaw.length
        : Array.isArray(hmacRaw)
          ? (hmacRaw[0]?.length ?? 0)
          : 0;
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
