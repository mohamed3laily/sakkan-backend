import { ArgumentsHost, ExecutionContext } from '@nestjs/common';

/** When set to `true` or `1` on `/v1/admin/*` requests, bilingual response shaping is skipped. */
export const RAW_RESPONSE_HEADER = 'x-raw-response';

type RequestLike = {
  path?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
};

function getRequest(ctx: ExecutionContext | ArgumentsHost): RequestLike {
  return 'switchToHttp' in ctx
    ? ctx.switchToHttp().getRequest<RequestLike>()
    : (ctx as ArgumentsHost).switchToHttp().getRequest<RequestLike>();
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
): string | undefined {
  const raw = headers?.[name];
  return Array.isArray(raw) ? raw[0] : raw;
}

function isTruthyHeader(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}

function getRequestPath(request: RequestLike): string {
  return request.path ?? request.url?.split('?')[0] ?? '';
}

export function isAdminPath(path: string): boolean {
  return path === '/v1/admin' || path.startsWith('/v1/admin/');
}

export function shouldSkipTranslation(ctx: ExecutionContext | ArgumentsHost): boolean {
  const request = getRequest(ctx);
  const path = getRequestPath(request);

  if (!isAdminPath(path)) {
    return false;
  }

  return isTruthyHeader(getHeaderValue(request.headers, RAW_RESPONSE_HEADER));
}
