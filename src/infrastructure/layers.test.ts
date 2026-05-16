import { Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@infrastructure/clients/db/turso/service', () => ({
  TursoServiceLive: Layer.empty,
}));
vi.mock('@infrastructure/clients/email/resend/service', () => ({
  ResendServiceLive: Layer.empty,
}));
vi.mock('@infrastructure/clients/logging/better-stack/service', () => ({
  LoggerServiceLive: Layer.empty,
}));
vi.mock('@infrastructure/clients/payments/stripe/serverService', () => ({
  StripeServerServiceLive: Layer.empty,
}));

const { ApplicationLayer } = await import('./layers');

describe('ApplicationLayer', () => {
  it('is defined', () => {
    expect(ApplicationLayer).toBeDefined();
  });

  it('is an Effect Layer', () => {
    expect(Layer.isLayer(ApplicationLayer)).toBe(true);
  });
});
