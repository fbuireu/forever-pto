import { TursoService } from '@infrastructure/clients/db/turso/service';
import { ResendService } from '@infrastructure/clients/email/resend/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { EmailError, ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendContactEmail } from './contact';

vi.mock('@application/shared/utils/zodParse', () => ({
  zodParse: vi.fn((_, data) => Effect.succeed(data)),
}));

vi.mock('@infrastructure/services/contact/repository', () => ({
  saveContact: vi.fn(() => Effect.succeed(undefined)),
}));

vi.mock('@infrastructure/services/email/templates/Contact', () => ({
  ContactFormEmail: vi.fn(() => null),
}));

vi.mock('@react-email/render', () => ({
  render: vi.fn().mockResolvedValue('<html>email</html>'),
}));

const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const mockSend = vi.fn(() => Effect.succeed({ messageId: 'msg_123' }));
const TestLayer = Layer.mergeAll(
  Layer.succeed(LoggerService, mockLogger),
  Layer.succeed(ResendService, { send: mockSend }),
  Layer.succeed(TursoService, { query: vi.fn(), execute: vi.fn(), batch: vi.fn() })
);

type ContactR = LoggerService | ResendService | TursoService;
const run = <E>(eff: Effect.Effect<void, E, ContactR>) => Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));
const runFail = <E>(eff: Effect.Effect<void, E, ContactR>) =>
  Effect.runPromise(Effect.flip(eff).pipe(Effect.provide(TestLayer)));

const VALID_DATA = {
  name: 'Alice Smith',
  email: 'alice@example.com',
  subject: 'Test subject',
  message: 'This is a test message for the contact form.',
};
const CONFIG = { siteUrl: 'https://example.com', contactEmail: 'contact@example.com' };

beforeEach(() => vi.clearAllMocks());

describe('sendContactEmail', () => {
  it('resolves on success', async () => {
    await expect(run(sendContactEmail(VALID_DATA, CONFIG))).resolves.toBeUndefined();
  });

  it('calls resend.send once', async () => {
    await run(sendContactEmail(VALID_DATA, CONFIG));
    expect(mockSend).toHaveBeenCalledOnce();
  });

  it('sends from and to contactEmail', async () => {
    await run(sendContactEmail(VALID_DATA, CONFIG));
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'contact@example.com', from: expect.stringContaining('contact@example.com') })
    );
  });

  it('passes siteUrl to the email template', async () => {
    await run(sendContactEmail(VALID_DATA, CONFIG));
    const { ContactFormEmail } = await import('@infrastructure/services/email/templates/Contact');
    expect(vi.mocked(ContactFormEmail)).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'https://example.com' })
    );
  });

  it('includes the subject in the email', async () => {
    await run(sendContactEmail(VALID_DATA, CONFIG));
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('Test subject') })
    );
  });

  it('fails with ValidationError when zodParse fails', async () => {
    const { zodParse } = await import('@application/shared/utils/zodParse');
    vi.mocked(zodParse).mockReturnValueOnce(Effect.fail(new ValidationError({ message: 'invalid' })));
    const err = await runFail(sendContactEmail(VALID_DATA, CONFIG));
    expect(err).toBeInstanceOf(ValidationError);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('fails with EmailError when render throws', async () => {
    const { render } = await import('@react-email/render');
    vi.mocked(render).mockRejectedValueOnce(new Error('template error'));
    const err = await runFail(sendContactEmail(VALID_DATA, CONFIG));
    expect(err).toBeInstanceOf(EmailError);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('fails with EmailError when send fails', async () => {
    mockSend.mockReturnValueOnce(Effect.fail(new EmailError({ message: 'send failed' })) as never);
    const err = await runFail(sendContactEmail(VALID_DATA, CONFIG));
    expect(err).toBeInstanceOf(EmailError);
  });

  it('resolves even when saveContact fails', async () => {
    const { saveContact } = await import('@infrastructure/services/contact/repository');
    vi.mocked(saveContact).mockReturnValueOnce(Effect.fail({ _tag: 'DatabaseError', message: 'db error' } as never));
    await expect(run(sendContactEmail(VALID_DATA, CONFIG))).resolves.toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledOnce();
  });
});
