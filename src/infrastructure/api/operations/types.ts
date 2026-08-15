export const UNKNOWN_IP = 'unknown';

export interface ApiOutcome<BODY> {
  status: number;
  body: BODY;
}

export interface RequestContext {
  userAgent: string | null;
  ipAddress: string | null;
}

export const resolveClientIp = (headers: Headers): string | null =>
  headers.get('cf-connecting-ip') ?? headers.get('x-forwarded-for') ?? headers.get('x-real-ip');
