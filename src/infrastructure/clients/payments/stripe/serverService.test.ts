import { PaymentError, WebhookError } from '@infrastructure/errors';
import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  StripeSignatureVerificationError,
  mockPaymentIntentsCreate,
  mockPaymentIntentsRetrieve,
  mockChargesRetrieve,
  mockPromotionCodesList,
  mockPromotionCodesRetrieve,
  mockWebhooksConstructEvent,
  MockStripeNode,
} = vi.hoisted(() => {
  class StripeSignatureVerificationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'StripeSignatureVerificationError';
    }
  }
  const mockPaymentIntentsCreate = vi.fn();
  const mockPaymentIntentsRetrieve = vi.fn();
  const mockChargesRetrieve = vi.fn();
  const mockPromotionCodesList = vi.fn();
  const mockPromotionCodesRetrieve = vi.fn();
  const mockWebhooksConstructEvent = vi.fn();
  class MockStripe {
    paymentIntents = { create: mockPaymentIntentsCreate, retrieve: mockPaymentIntentsRetrieve };
    charges = { retrieve: mockChargesRetrieve };
    promotionCodes = { list: mockPromotionCodesList, retrieve: mockPromotionCodesRetrieve };
    webhooks = { constructEvent: mockWebhooksConstructEvent };
  }
  const MockStripeNode = Object.assign(
    vi.fn().mockImplementation(MockStripe as unknown as () => InstanceType<typeof MockStripe>),
    {
      createFetchHttpClient: vi.fn().mockReturnValue({}),
      errors: { StripeSignatureVerificationError },
    }
  );
  return {
    StripeSignatureVerificationError,
    mockPaymentIntentsCreate,
    mockPaymentIntentsRetrieve,
    mockChargesRetrieve,
    mockPromotionCodesList,
    mockPromotionCodesRetrieve,
    mockWebhooksConstructEvent,
    MockStripeNode,
  };
});

vi.mock('stripe', () => ({ default: MockStripeNode }));

const { StripeServerService, StripeServerServiceLive } = await import('./serverService');

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_key';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('StripeServerServiceLive initialisation', () => {
  it('throws when STRIPE_SECRET_KEY is missing', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    expect(() => Effect.runSync(Effect.provide(StripeServerService, StripeServerServiceLive))).toThrow(
      'STRIPE_SECRET_KEY'
    );
  });
});

describe('StripeServerService.paymentIntents.retrieve', () => {
  it('returns the payment intent on success', async () => {
    const pi = { id: 'pi_123', status: 'succeeded' };
    mockPaymentIntentsRetrieve.mockResolvedValue(pi);
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.paymentIntents.retrieve('pi_123');
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(result).toEqual(pi);
  });

  it('wraps SDK errors as PaymentError', async () => {
    mockPaymentIntentsRetrieve.mockRejectedValue(new Error('network error'));
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.paymentIntents.retrieve('pi_bad').pipe(Effect.flip);
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(error).toBeInstanceOf(PaymentError);
  });
});

describe('StripeServerService.paymentIntents.create', () => {
  it('returns the created payment intent on success', async () => {
    const pi = { id: 'pi_new', status: 'requires_payment_method' };
    mockPaymentIntentsCreate.mockResolvedValue(pi);
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.paymentIntents.create({ amount: 999, currency: 'usd' });
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(result).toEqual(pi);
  });

  it('wraps SDK errors as PaymentError', async () => {
    mockPaymentIntentsCreate.mockRejectedValue(new Error('card declined'));
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.paymentIntents.create({ amount: 999, currency: 'usd' }).pipe(Effect.flip);
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(error).toBeInstanceOf(PaymentError);
  });

  it('wraps non-Error SDK rejections as PaymentError with stringified message', async () => {
    mockPaymentIntentsCreate.mockRejectedValue('string error');
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.paymentIntents.create({ amount: 999, currency: 'usd' }).pipe(Effect.flip);
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(error).toBeInstanceOf(PaymentError);
    expect(error.message).toBe('string error');
  });
});

describe('StripeServerService.charges.retrieve', () => {
  it('returns the charge on success', async () => {
    const charge = { id: 'ch_123', amount: 999 };
    mockChargesRetrieve.mockResolvedValue(charge);
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.charges.retrieve('ch_123');
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(result).toEqual(charge);
  });

  it('wraps SDK errors as PaymentError', async () => {
    mockChargesRetrieve.mockRejectedValue(new Error('charge not found'));
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.charges.retrieve('ch_bad').pipe(Effect.flip);
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(error).toBeInstanceOf(PaymentError);
    expect(error.message).toBe('charge not found');
  });
});

describe('StripeServerService.promotionCodes.list', () => {
  it('returns the list of promotion codes on success', async () => {
    const list = { data: [{ id: 'promo_1', code: 'SAVE10' }], has_more: false };
    mockPromotionCodesList.mockResolvedValue(list);
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.promotionCodes.list({ code: 'SAVE10' });
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(result).toEqual(list);
  });

  it('wraps SDK errors as PaymentError', async () => {
    mockPromotionCodesList.mockRejectedValue(new Error('list failed'));
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.promotionCodes.list({}).pipe(Effect.flip);
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(error).toBeInstanceOf(PaymentError);
  });
});

describe('StripeServerService.promotionCodes.retrieve', () => {
  it('returns the promotion code on success', async () => {
    const promo = { id: 'promo_1', code: 'SAVE10' };
    mockPromotionCodesRetrieve.mockResolvedValue(promo);
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.promotionCodes.retrieve('promo_1');
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(result).toEqual(promo);
  });

  it('wraps SDK errors as PaymentError', async () => {
    mockPromotionCodesRetrieve.mockRejectedValue(new Error('not found'));
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.promotionCodes.retrieve('promo_bad').pipe(Effect.flip);
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(error).toBeInstanceOf(PaymentError);
  });
});

describe('StripeServerService.webhooks.constructEvent', () => {
  it('returns the event on valid signature', async () => {
    const event = { type: 'payment_intent.succeeded', id: 'evt_1' };
    mockWebhooksConstructEvent.mockReturnValue(event);
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.webhooks.constructEvent('payload', 'sig');
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(result).toEqual(event);
  });

  it('wraps signature verification errors as WebhookError with isSignatureError=true', async () => {
    mockWebhooksConstructEvent.mockImplementation(() => {
      throw new StripeSignatureVerificationError('invalid signature');
    });
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.webhooks.constructEvent('payload', 'bad-sig').pipe(Effect.flip);
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(error).toBeInstanceOf(WebhookError);
    expect(error.isSignatureError).toBe(true);
  });

  it('wraps non-signature errors as WebhookError with isSignatureError=false', async () => {
    mockWebhooksConstructEvent.mockImplementation(() => {
      throw new Error('generic error');
    });
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.webhooks.constructEvent('payload', 'sig').pipe(Effect.flip);
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(error).toBeInstanceOf(WebhookError);
    expect(error.isSignatureError).toBe(false);
  });

  it('fails as WebhookError when STRIPE_WEBHOOK_SECRET is missing', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const stripe = yield* StripeServerService;
        return yield* stripe.webhooks.constructEvent('payload', 'sig').pipe(Effect.flip);
      }).pipe(Effect.provide(StripeServerServiceLive))
    );
    expect(error).toBeInstanceOf(WebhookError);
  });
});
