import { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import { PromoCodeError, PromoCodeErrors } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { validatePromoCode } = await import('./promoCode');

const mockList = vi.fn();
const mockRetrieve = vi.fn();

const MockStripeLayer = Layer.succeed(StripeServerService, {
  paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
  charges: { retrieve: vi.fn() },
  promotionCodes: { list: mockList, retrieve: mockRetrieve },
  webhooks: { constructEvent: vi.fn() },
});

const run = (code: string, amount: number) =>
  Effect.runPromise(validatePromoCode(code, amount).pipe(Effect.provide(MockStripeLayer)));

const runFlip = (code: string, amount: number) =>
  Effect.runPromise(validatePromoCode(code, amount).pipe(Effect.provide(MockStripeLayer), Effect.flip));

const makePromoCode = (id = 'promo_abc') => ({ id });

const makeCoupon = (overrides: Partial<{
  valid: boolean;
  max_redemptions: number | null;
  times_redeemed: number;
  redeem_by: number | null;
  percent_off: number | null;
  amount_off: number | null;
  name: string | null;
}> = {}) => ({
  id: 'coup_abc',
  valid: true,
  max_redemptions: null,
  times_redeemed: 0,
  redeem_by: null,
  percent_off: 10,
  amount_off: null,
  name: 'SAVE10',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

const setupMocks = (coupon: ReturnType<typeof makeCoupon>) => {
  mockList.mockReturnValue(Effect.succeed({ data: [makePromoCode()] }));
  mockRetrieve.mockReturnValue(Effect.succeed({ coupon }));
};

describe('validatePromoCode', () => {
  describe('successful validation', () => {
    it('returns DiscountInfo with percent discount', async () => {
      setupMocks(makeCoupon({ percent_off: 10, amount_off: null }));
      const result = await run('SAVE10', 10);
      expect(result).toMatchObject({
        type: 'percent',
        value: 10,
        originalAmount: 10,
        finalAmount: 9,
        couponId: 'coup_abc',
        couponName: 'SAVE10',
      });
    });

    it('returns DiscountInfo with fixed amount discount', async () => {
      setupMocks(makeCoupon({ percent_off: null, amount_off: 200 }));
      const result = await run('FIXED2', 10);
      expect(result).toMatchObject({
        type: 'fixed',
        value: 2,
        originalAmount: 10,
        finalAmount: 8,
      });
    });

    it('uppercases and trims the promo code before listing', async () => {
      setupMocks(makeCoupon());
      await run('  save10  ', 10);
      const [params] = mockList.mock.calls[0] as [{ code: string }];
      expect(params.code).toBe('SAVE10');
    });
  });

  describe('validation errors', () => {
    it('fails with INVALID_OR_EXPIRED when no promo codes are found', async () => {
      mockList.mockReturnValue(Effect.succeed({ data: [] }));
      const error = await runFlip('BADCODE', 10);
      expect(error).toBeInstanceOf(PromoCodeError);
      expect((error as PromoCodeError).code).toBe(PromoCodeErrors.INVALID_OR_EXPIRED);
    });

    it('fails with COUPON_INVALID when coupon is not valid', async () => {
      setupMocks(makeCoupon({ valid: false }));
      const error = await runFlip('BAD', 10);
      expect((error as PromoCodeError).code).toBe(PromoCodeErrors.COUPON_INVALID);
    });

    it('fails with USAGE_LIMIT_REACHED when max redemptions exceeded', async () => {
      setupMocks(makeCoupon({ max_redemptions: 5, times_redeemed: 5 }));
      const error = await runFlip('MAXED', 10);
      expect((error as PromoCodeError).code).toBe(PromoCodeErrors.USAGE_LIMIT_REACHED);
    });

    it('fails with COUPON_EXPIRED when redeem_by is in the past', async () => {
      setupMocks(makeCoupon({ redeem_by: Math.floor(Date.now() / 1000) - 3600 }));
      const error = await runFlip('EXPIRED', 10);
      expect((error as PromoCodeError).code).toBe(PromoCodeErrors.COUPON_EXPIRED);
    });

    it('fails with MIN_AMOUNT_EXCEEDED when finalAmount is below 0.50', async () => {
      setupMocks(makeCoupon({ percent_off: 99, amount_off: null }));
      const error = await runFlip('BIG', 0.10);
      expect((error as PromoCodeError).code).toBe(PromoCodeErrors.MIN_AMOUNT_EXCEEDED);
    });

    it('fails with FAILED_TO_LOAD when coupon is null on retrieve', async () => {
      mockList.mockReturnValue(Effect.succeed({ data: [makePromoCode()] }));
      mockRetrieve.mockReturnValue(Effect.succeed({ coupon: null }));
      const error = await runFlip('NULL', 10);
      expect((error as PromoCodeError).code).toBe(PromoCodeErrors.FAILED_TO_LOAD);
    });

    it('fails with FAILED_TO_LOAD when list() rejects', async () => {
      mockList.mockReturnValue(Effect.fail(new PromoCodeError({ code: PromoCodeErrors.FAILED_TO_LOAD, message: 'network error' })));
      const error = await runFlip('ERR', 10);
      expect((error as PromoCodeError).code).toBe(PromoCodeErrors.FAILED_TO_LOAD);
    });

    it('fails with FAILED_TO_LOAD when retrieve() rejects', async () => {
      mockList.mockReturnValue(Effect.succeed({ data: [makePromoCode()] }));
      mockRetrieve.mockReturnValue(Effect.fail(new PromoCodeError({ code: PromoCodeErrors.FAILED_TO_LOAD, message: 'retrieve error' })));
      const error = await runFlip('ERR', 10);
      expect((error as PromoCodeError).code).toBe(PromoCodeErrors.FAILED_TO_LOAD);
    });
  });
});
