import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AppleIAPWebhookService } from './apple-iap-webhook.service';

@Controller('payments')
export class AppleIAPWebhookController {
  constructor(private readonly webhookService: AppleIAPWebhookService) {}

  @Post('apple-webhook')
  @HttpCode(HttpStatus.OK)
  handleNotification(@Body() body: unknown) {
    return this.webhookService.handleNotification(body);
  }
}
