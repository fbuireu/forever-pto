import { Effect, Layer } from 'effect';
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

vi.mock('@tursodatabase/serverless', () => ({ connect: vi.fn() }));
vi.mock('resend', () => ({ Resend: vi.fn() }));
vi.mock('stripe', () => ({
  default: Object.assign(vi.fn(), {
    createFetchHttpClient: vi.fn(),
    errors: { StripeSignatureVerificationError: Error },
  }),
}));
vi.mock('@logtail/edge', () => ({ Logtail: vi.fn() }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: vi.fn().mockReturnValue({ ctx: {} }) }));

const { ApplicationLayer } = await import('./layers');

const CLIENT_ENV_KEYS = [
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN',
  'RESEND_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN',
  'NEXT_PUBLIC_BETTER_STACK_INGESTING_URL',
];

describe('ApplicationLayer', () => {
  it('is defined', () => {
    expect(ApplicationLayer).toBeDefined();
  });

  it('is an Effect Layer', () => {
    expect(Layer.isLayer(ApplicationLayer)).toBe(true);
  });

  it('builds the real client layers with no environment variable set', async () => {
    for (const key of CLIENT_ENV_KEYS) vi.stubEnv(key, '');

    vi.resetModules();
    vi.doUnmock('@infrastructure/clients/db/turso/service');
    vi.doUnmock('@infrastructure/clients/email/resend/service');
    vi.doUnmock('@infrastructure/clients/logging/better-stack/service');
    vi.doUnmock('@infrastructure/clients/payments/stripe/serverService');

    const { ApplicationLayer: realLayer } = await import('./layers');

    await expect(Effect.runPromise(Effect.scoped(Layer.build(realLayer)))).resolves.toBeDefined();

    vi.unstubAllEnvs();
  });

  it('turns a missing client variable into a typed failure at the call, not a defect at the build', async () => {
    for (const key of CLIENT_ENV_KEYS) vi.stubEnv(key, '');

    vi.resetModules();
    vi.doUnmock('@infrastructure/clients/db/turso/service');
    vi.doUnmock('@infrastructure/clients/email/resend/service');
    vi.doUnmock('@infrastructure/clients/logging/better-stack/service');
    vi.doUnmock('@infrastructure/clients/payments/stripe/serverService');

    const [{ ApplicationLayer: realLayer }, { TursoService }] = await Promise.all([
      import('./layers'),
      import('@infrastructure/clients/db/turso/service'),
    ]);

    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const turso = yield* TursoService;
        return yield* turso.query('SELECT 1').pipe(Effect.flip);
      }).pipe(Effect.provide(realLayer))
    );

    expect(error._tag).toBe('DatabaseError');
    expect(error.message).toContain('TURSO_DATABASE_URL');

    vi.unstubAllEnvs();
  });
});
