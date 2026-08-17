import type {
  DatabaseError,
  EmailError,
  PaymentError,
  PromoCodeError,
  RateLimitError,
  SessionError,
  ValidationError,
} from '@infrastructure/errors';

export const ApiError = {
  INTERNAL_ERROR: 'internal_error',
  NOT_FOUND: 'not_found',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  EMAIL_REQUIRED: 'email_required',
  MISSING_SIGNATURE: 'missing_signature',
  INVALID_SIGNATURE: 'invalid_signature',
  WEBHOOK_PROCESSING_FAILED: 'webhook_processing_failed',
  WEBHOOK_MISCONFIGURED: 'webhook_misconfigured',
} as const;

export type TaggedFailure =
  | RateLimitError
  | ValidationError
  | PromoCodeError
  | PaymentError
  | EmailError
  | SessionError
  | DatabaseError;

export interface FailureDescriptor {
  status: number;
  error: string;
}

const OPAQUE: FailureDescriptor = { status: 500, error: ApiError.INTERNAL_ERROR };

const FAILURE_RESPONSES: {
  [TAG in TaggedFailure['_tag']]: (failure: Extract<TaggedFailure, { _tag: TAG }>) => FailureDescriptor;
} = {
  RateLimitError: () => ({ status: 429, error: ApiError.RATE_LIMIT_EXCEEDED }),
  ValidationError: (failure) => ({ status: 400, error: failure.message }),
  PromoCodeError: (failure) => ({ status: 400, error: failure.code }),
  PaymentError: () => OPAQUE,
  EmailError: () => OPAQUE,
  SessionError: () => OPAQUE,
  DatabaseError: () => OPAQUE,
};

export const describeFailure = (failure: TaggedFailure): FailureDescriptor => {
  const describe = FAILURE_RESPONSES[failure._tag] as ((failure: TaggedFailure) => FailureDescriptor) | undefined;
  return describe ? describe(failure) : OPAQUE;
};
