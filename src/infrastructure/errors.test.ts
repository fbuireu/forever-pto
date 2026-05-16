import { describe, expect, it } from 'vitest';
import {
  DatabaseError,
  EmailError,
  PaymentError,
  PromoCodeError,
  PromoCodeErrors,
  RateLimitError,
  SessionError,
  ValidationError,
  WebhookError,
} from './errors';

describe('PromoCodeErrors', () => {
  it('exposes the expected wire-format codes', () => {
    expect(PromoCodeErrors).toEqual({
      INVALID_OR_EXPIRED: 'invalid_or_expired',
      USAGE_LIMIT_REACHED: 'usage_limit_reached',
      COUPON_EXPIRED: 'coupon_expired',
      COUPON_INVALID: 'coupon_invalid',
      FAILED_TO_LOAD: 'failed_to_load',
      MIN_AMOUNT_EXCEEDED: 'min_amount_exceeded',
    });
  });
});

describe('DatabaseError', () => {
  it('has the correct _tag', () => {
    const error = new DatabaseError({ message: 'db failure' });
    expect(error._tag).toBe('DatabaseError');
  });

  it('carries the message property', () => {
    const error = new DatabaseError({ message: 'connection lost' });
    expect(error.message).toBe('connection lost');
  });

  it('carries an optional cause', () => {
    const cause = new Error('root cause');
    const error = new DatabaseError({ message: 'wrapped', cause });
    expect(error.cause).toBe(cause);
  });
});

describe('EmailError', () => {
  it('has the correct _tag', () => {
    expect(new EmailError({ message: 'send failed' })._tag).toBe('EmailError');
  });

  it('carries the message', () => {
    expect(new EmailError({ message: 'timeout' }).message).toBe('timeout');
  });
});

describe('PaymentError', () => {
  it('has the correct _tag', () => {
    expect(new PaymentError({ message: 'declined' })._tag).toBe('PaymentError');
  });
});

describe('PromoCodeError', () => {
  it('has the correct _tag', () => {
    const error = new PromoCodeError({ code: PromoCodeErrors.COUPON_EXPIRED });
    expect(error._tag).toBe('PromoCodeError');
  });

  it('carries the code', () => {
    const error = new PromoCodeError({ code: PromoCodeErrors.INVALID_OR_EXPIRED });
    expect(error.code).toBe(PromoCodeErrors.INVALID_OR_EXPIRED);
  });

  it('carries an optional message', () => {
    const error = new PromoCodeError({ code: PromoCodeErrors.COUPON_INVALID, message: 'extra info' });
    expect(error.message).toBe('extra info');
  });
});

describe('RateLimitError', () => {
  it('has the correct _tag', () => {
    expect(new RateLimitError({ ip: '1.2.3.4' })._tag).toBe('RateLimitError');
  });

  it('carries the ip', () => {
    expect(new RateLimitError({ ip: '10.0.0.1' }).ip).toBe('10.0.0.1');
  });
});

describe('WebhookError', () => {
  it('has the correct _tag', () => {
    expect(new WebhookError({ message: 'bad sig', isSignatureError: true })._tag).toBe('WebhookError');
  });

  it('carries isSignatureError', () => {
    const error = new WebhookError({ message: 'sig mismatch', isSignatureError: true });
    expect(error.isSignatureError).toBe(true);
  });
});

describe('SessionError', () => {
  it('has the correct _tag', () => {
    expect(new SessionError({ message: 'expired' })._tag).toBe('SessionError');
  });
});

describe('ValidationError', () => {
  it('has the correct _tag', () => {
    expect(new ValidationError({ message: 'invalid email' })._tag).toBe('ValidationError');
  });

  it('carries the message', () => {
    expect(new ValidationError({ message: 'required field' }).message).toBe('required field');
  });
});
