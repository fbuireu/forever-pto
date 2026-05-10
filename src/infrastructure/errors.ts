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

export class PromoCodeError extends Data.TaggedError('PromoCodeError')<{
  message: string;
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

export class NotFoundError extends Data.TaggedError('NotFoundError')<{
  resource: string;
  id?: string;
}> {}
