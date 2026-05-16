import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import { Effect, Layer } from 'effect';
import type Stripe from 'stripe';
import { processWebhookEvent } from './webhook';

vi.mock('@domain/payment/events/factory/events', () => ({
  createPaymentSucceededEvent: vi.fn().mockReturnValue({ type: 'payment_succeeded', paymentId: 'pi_test' }),
  createPaymentFailedEvent: vi.fn().mockReturnValue({ type: 'payment_failed', paymentId: 'pi_test' }),
}));

vi.mock('@domain/payment/handlers/payment-succeeded', () => ({
  handlePaymentSucceeded: vi.fn(() => Effect.succeed(undefined)),
}));

vi.mock('@domain/payment/handlers/payment-failed', () => ({
  handlePaymentFailed: vi.fn(() => Effect.succeed(undefined)),
}));

vi.mock('@infrastructure/services/payments/repository', () => ({
  getPaymentById: vi.fn(() => Effect.succeed({ id: 'pi_test', status: 'pending' })),
  savePayment: vi.fn(() => Effect.succeed(undefined)),
}));

vi.mock('@application/dto/payment/dto', () => ({
  paymentDataDTO: { create: vi.fn().mockReturnValue({ id: 'pi_test' }) },
}));

const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const TestLayer = Layer.mergeAll(
  Layer.succeed(LoggerService, mockLogger),
  Layer.succeed(TursoService, { query: vi.fn(), execute: vi.fn(), batch: vi.fn() }),
  Layer.succeed(StripeServerService, {
    paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
    charges: { retrieve: vi.fn() },
    promotionCodes: { list: vi.fn(), retrieve: vi.fn() },
    webhooks: { constructEvent: vi.fn() },
  })
);

type WebhookR = LoggerService | TursoService | StripeServerService;
const run = <E>(eff: Effect.Effect<void, E, WebhookR>) =>
  Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));

const makeEvent = (type: string, object: unknown): Stripe.Event =>
  ({ type, data: { object }, id: 'evt_test', object: 'event' } as Stripe.Event);

beforeEach(() => vi.clearAllMocks());

describe('processWebhookEvent', () => {
  it('calls handlePaymentSucceeded for payment_intent.succeeded', async () => {
    const { handlePaymentSucceeded } = await import('@domain/payment/handlers/payment-succeeded');
    await run(processWebhookEvent(makeEvent('payment_intent.succeeded', { id: 'pi_test' })));
    expect(handlePaymentSucceeded).toHaveBeenCalledOnce();
  });

  it('calls createPaymentSucceededEvent with the payment intent object', async () => {
    const { createPaymentSucceededEvent } = await import('@domain/payment/events/factory/events');
    const intent = { id: 'pi_test', status: 'succeeded' };
    await run(processWebhookEvent(makeEvent('payment_intent.succeeded', intent)));
    expect(createPaymentSucceededEvent).toHaveBeenCalledWith(intent);
  });

  it('does not call savePayment when payment already exists', async () => {
    const { savePayment } = await import('@infrastructure/services/payments/repository');
    await run(processWebhookEvent(makeEvent('payment_intent.succeeded', { id: 'pi_test' })));
    expect(savePayment).not.toHaveBeenCalled();
  });

  it('calls savePayment when payment is not found in DB', async () => {
    const { getPaymentById, savePayment } = await import('@infrastructure/services/payments/repository');
    vi.mocked(getPaymentById).mockReturnValueOnce(Effect.succeed(undefined as never));
    await run(processWebhookEvent(makeEvent('payment_intent.succeeded', { id: 'pi_test' })));
    expect(savePayment).toHaveBeenCalledOnce();
  });

  it('calls handlePaymentFailed for payment_intent.payment_failed', async () => {
    const { handlePaymentFailed } = await import('@domain/payment/handlers/payment-failed');
    await run(processWebhookEvent(makeEvent('payment_intent.payment_failed', { id: 'pi_test' })));
    expect(handlePaymentFailed).toHaveBeenCalledOnce();
  });

  it('calls createPaymentFailedEvent with the payment intent object', async () => {
    const { createPaymentFailedEvent } = await import('@domain/payment/events/factory/events');
    const intent = { id: 'pi_test' };
    await run(processWebhookEvent(makeEvent('payment_intent.payment_failed', intent)));
    expect(createPaymentFailedEvent).toHaveBeenCalledWith(intent);
  });

  it('logs a warning for unhandled event types', async () => {
    await run(processWebhookEvent(makeEvent('customer.created', {})));
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Unhandled webhook event type',
      expect.objectContaining({ eventType: 'customer.created' })
    );
  });

  it('does not call any handler for unhandled event types', async () => {
    const { handlePaymentSucceeded } = await import('@domain/payment/handlers/payment-succeeded');
    const { handlePaymentFailed } = await import('@domain/payment/handlers/payment-failed');
    await run(processWebhookEvent(makeEvent('customer.created', {})));
    expect(handlePaymentSucceeded).not.toHaveBeenCalled();
    expect(handlePaymentFailed).not.toHaveBeenCalled();
  });
});
