import { TursoService } from '@infrastructure/clients/db/turso/service';
import { DatabaseError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { saveContact } = await import('./repository');

const mockExecute = vi.fn();

const MockTursoLayer = Layer.succeed(TursoService, {
  execute: mockExecute,
  query: vi.fn(),
  batch: vi.fn(),
});

const CONTACT_DATA = {
  email: 'user@example.com',
  name: 'Test User',
  subject: 'Hello',
  message: 'Test message',
  messageId: null,
  origin: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
  );
  mockExecute.mockReturnValue(Effect.succeed(undefined));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('saveContact', () => {
  it('executes an INSERT with the generated UUID and contact data', async () => {
    await Effect.runPromise(saveContact(CONTACT_DATA).pipe(Effect.provide(MockTursoLayer)));

    expect(mockExecute).toHaveBeenCalledOnce();
    const [sql, args] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO contacts');
    expect(args[0]).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(args[1]).toBe(CONTACT_DATA.email);
    expect(args[2]).toBe(CONTACT_DATA.name);
    expect(args[3]).toBe(CONTACT_DATA.subject);
    expect(args[4]).toBe(CONTACT_DATA.message);
  });

  it('passes null for messageId and origin when they are null', async () => {
    await Effect.runPromise(saveContact(CONTACT_DATA).pipe(Effect.provide(MockTursoLayer)));

    const [, args] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(args[5]).toBeNull();
    expect(args[6]).toBeNull();
  });

  it('passes messageId and origin when provided', async () => {
    const data = { ...CONTACT_DATA, messageId: 'msg-123', origin: process.env.NEXT_PUBLIC_SITE_URL };
    await Effect.runPromise(saveContact(data).pipe(Effect.provide(MockTursoLayer)));

    const [, args] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(args[5]).toBe('msg-123');
    expect(args[6]).toBe(process.env.NEXT_PUBLIC_SITE_URL);
  });

  it('propagates DatabaseError when execute fails', async () => {
    const dbError = new DatabaseError({ message: 'connection refused', cause: new Error('test-error') });
    mockExecute.mockReturnValue(Effect.fail(dbError));

    const error = await Effect.runPromise(
      saveContact(CONTACT_DATA).pipe(Effect.provide(MockTursoLayer), Effect.flip)
    );

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.message).toBe('connection refused');
  });
});
