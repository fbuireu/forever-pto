import { Data } from 'effect';

export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  message: string;
  cause?: unknown;
}> {}

export class EmailError extends Data.TaggedError('EmailError')<{
  message: string;
  cause?: unknown;
}> {}

export class PaymentError extends Data.TaggedError('PaymentError')<{
  message: string;
  cause?: unknown;
}> {}

export const PromoCodeErrors = {
  INVALID_OR_EXPIRED: 'invalid_or_expired',
  USAGE_LIMIT_REACHED: 'usage_limit_reached',
  COUPON_EXPIRED: 'coupon_expired',
  COUPON_INVALID: 'coupon_invalid',
  FAILED_TO_LOAD: 'failed_to_load',
  MIN_AMOUNT_EXCEEDED: 'min_amount_exceeded',
} as const;

export type PromoCodeErrorCode = (typeof PromoCodeErrors)[keyof typeof PromoCodeErrors];

export class PromoCodeError extends Data.TaggedError('PromoCodeError')<{
  code: PromoCodeErrorCode;
  message?: string;
}> {}

export class RateLimitError extends Data.TaggedError('RateLimitError')<{
  ip: string;
}> {}

export class WebhookError extends Data.TaggedError('WebhookError')<{
  message: string;
  isSignatureError: boolean;
  cause?: unknown;
}> {}

export class SessionError extends Data.TaggedError('SessionError')<{
  message: string;
  cause?: unknown;
}> {}

export class ValidationError extends Data.TaggedError('ValidationError')<{
  message: string;
}> {}
