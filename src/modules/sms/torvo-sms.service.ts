import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Torvo quick send — `POST https://smsapi.torvochat.com/sms/send`
 * Headers: `Content-Type: application/json`, `x-api-key: <key>`
 * Body (per Torvo docs):
 * `{ "countryCode": "20", "recipients": ["+E164..."], "message": "...", "senderId": "TORVOSMS" }`
 * Env: `TORVO_SMS_API_KEY`, `TORVO_SMS_SENDER_ID` (your approved sender id).
 */
@Injectable()
export class TorvoSmsService {
  private static readonly COUNTRY_CODE_EG = '20';

  private readonly logger = new Logger(TorvoSmsService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly senderId: string;
  private readonly requestTimeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('TORVO_SMS_API_KEY').trim();
    this.baseUrl = (
      this.config.get<string>('TORVO_SMS_BASE_URL') ?? 'https://smsapi.torvochat.com'
    ).replace(/\/$/, '');
    const senderId =
      this.config.get<string>('TORVO_SMS_SENDER_ID')?.trim() ||
      this.config.get<string>('TORVO_SMS_SENDER')?.trim();
    if (!senderId) {
      throw new Error(
        'Torvo SMS: set TORVO_SMS_SENDER_ID (or legacy TORVO_SMS_SENDER) to your sender id from the Torvo dashboard',
      );
    }
    this.senderId = senderId;
    this.requestTimeoutMs = Math.max(
      5_000,
      Number(this.config.get('TORVO_SMS_REQUEST_TIMEOUT_MS') ?? 20_000),
    );
  }

  /** Plain ASCII — some SMS backends return 500 on certain Unicode (Arabic / em dash) in `message`. */
  buildPhoneVerificationMessage(code: string): string {
    return `Sakkan verification code: ${code}`;
  }

  buildPasswordResetMessage(code: string): string {
    return `Sakkan password reset code: ${code}`;
  }

  async sendQuickSms(phoneE164: string, message: string): Promise<TorvoSendResult> {
    const url = `${this.baseUrl}/sms/send`;
    const body = this.buildSendBody(phoneE164, message);

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      this.logger.error(
        e instanceof Error ? e.message : String(e),
        e instanceof Error ? e.stack : undefined,
      );
      throw new InternalServerErrorException('SMS_SEND_FAILED');
    } finally {
      clearTimeout(t);
    }

    const rawText = await res.text();
    if (!res.ok) {
      this.logger.error(
        `Torvo SMS send failed (HTTP ${res.status}). Request body (compare to working curl): ${JSON.stringify(body)}. Response: ${rawText}`,
      );
      throw new InternalServerErrorException('SMS_SEND_FAILED');
    }

    let parsed: unknown;
    try {
      parsed = rawText ? (JSON.parse(rawText) as unknown) : null;
    } catch {
      parsed = { raw: rawText };
    }

    const messageId = extractMessageId(parsed);
    this.logger.log(`Torvo SMS queued/sent: messageId=${messageId ?? 'n/a'}`);

    return { messageId, raw: parsed };
  }

  async getMessageStatus(messageId: string): Promise<unknown> {
    const url = `${this.baseUrl}/sms/status/${encodeURIComponent(messageId)}`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'x-api-key': this.apiKey },
      });
    } catch (e) {
      this.logger.error(
        e instanceof Error ? e.message : String(e),
        e instanceof Error ? e.stack : undefined,
      );
      throw new InternalServerErrorException('SMS_SEND_FAILED');
    } finally {
      clearTimeout(t);
    }
    const rawText = await res.text();
    if (!res.ok) {
      this.logger.error(`Torvo SMS status failed: ${res.status} ${rawText}`);
      throw new InternalServerErrorException('SMS_SEND_FAILED');
    }
    try {
      return rawText ? JSON.parse(rawText) : null;
    } catch {
      return rawText;
    }
  }

  private buildSendBody(phoneE164: string, message: string): TorvoSendRequestBody {
    const text = (message == null ? '' : String(message)).trim();
    if (text.length === 0) {
      this.logger.error('Torvo: refused to send: SMS text is empty after trim');
      throw new InternalServerErrorException('SMS_SEND_FAILED');
    }
    const recipient = phoneE164.trim();
    return {
      countryCode: TorvoSmsService.COUNTRY_CODE_EG,
      recipients: [recipient],
      message: text,
      senderId: this.senderId,
    };
  }
}

type TorvoSendRequestBody = {
  countryCode: string;
  recipients: string[];
  message: string;
  senderId: string;
};

export type TorvoSendResult = {
  messageId?: string;
  raw: unknown;
};

function extractMessageId(data: unknown): string | undefined {
  if (data === null || typeof data !== 'object') {
    return undefined;
  }
  const o = data as Record<string, unknown>;
  const direct = o.messageId ?? o.id ?? o.message_id ?? o.MessageId;
  if (typeof direct === 'string' || typeof direct === 'number') {
    return String(direct);
  }
  if (o.data && typeof o.data === 'object') {
    return extractMessageId(o.data);
  }
  return undefined;
}
