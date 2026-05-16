import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSign, mockSetProtectedHeader, mockSetIssuedAt, mockSetExpirationTime, MockSignJWT, mockJwtVerify } =
  vi.hoisted(() => {
    const mockSign = vi.fn();
    const mockSetProtectedHeader = vi.fn();
    const mockSetIssuedAt = vi.fn();
    const mockSetExpirationTime = vi.fn();
    const MockSignJWT = vi.fn();
    const mockJwtVerify = vi.fn();
    return { mockSign, mockSetProtectedHeader, mockSetIssuedAt, mockSetExpirationTime, MockSignJWT, mockJwtVerify };
  });

vi.mock('jose', () => ({ SignJWT: MockSignJWT, jwtVerify: mockJwtVerify }));

const { createSession, verifySession } = await import('./session');

const SESSION_DATA = { email: 'user@example.com', paymentIntentId: 'pi_abc123' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('JWT_SECRET', 'test-jwt-secret');

  const instance = {
    setProtectedHeader: mockSetProtectedHeader,
    setIssuedAt: mockSetIssuedAt,
    setExpirationTime: mockSetExpirationTime,
    sign: mockSign,
  };
  mockSetProtectedHeader.mockReturnValue(instance);
  mockSetIssuedAt.mockReturnValue(instance);
  mockSetExpirationTime.mockReturnValue(instance);
  // biome-ignore lint/complexity/useArrowFunction: called with `new`; arrow fn is not a constructor
  MockSignJWT.mockImplementation(function () {
    return instance;
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createSession', () => {
  it('returns a signed JWT string on success', async () => {
    mockSign.mockResolvedValue('signed.jwt.token');

    const result = await Effect.runPromise(createSession(SESSION_DATA));

    expect(result).toBe('signed.jwt.token');
  });

  it('passes email and paymentIntentId to SignJWT constructor', async () => {
    mockSign.mockResolvedValue('token');

    await Effect.runPromise(createSession(SESSION_DATA));

    expect(MockSignJWT).toHaveBeenCalledWith({ email: SESSION_DATA.email, paymentIntentId: SESSION_DATA.paymentIntentId });
  });

  it('sets HS256 header, issuedAt, and expiration', async () => {
    mockSign.mockResolvedValue('token');

    await Effect.runPromise(createSession(SESSION_DATA));

    expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
    expect(mockSetIssuedAt).toHaveBeenCalled();
    expect(mockSetExpirationTime).toHaveBeenCalledWith(expect.any(Number));
  });

  it('passes encoded JWT_SECRET to sign', async () => {
    mockSign.mockResolvedValue('token');

    await Effect.runPromise(createSession(SESSION_DATA));

    expect(mockSign).toHaveBeenCalledWith(expect.any(Uint8Array));
  });

  it('returns SessionError when signing fails with an Error', async () => {
    mockSign.mockRejectedValue(new Error('sign failure'));

    const result = await Effect.runPromise(Effect.flip(createSession(SESSION_DATA)));

    expect(result._tag).toBe('SessionError');
    expect(result.message).toBe('sign failure');
  });

  it('returns SessionError with stringified message for non-Error rejection', async () => {
    mockSign.mockRejectedValue('unexpected');

    const result = await Effect.runPromise(Effect.flip(createSession(SESSION_DATA)));

    expect(result._tag).toBe('SessionError');
    expect(result.message).toBe('unexpected');
  });
});

describe('verifySession', () => {
  it('returns email and paymentIntentId from verified payload', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { email: 'user@example.com', paymentIntentId: 'pi_abc123' } });

    const result = await Effect.runPromise(verifySession('valid.jwt.token'));

    expect(result).toEqual({ email: 'user@example.com', paymentIntentId: 'pi_abc123' });
  });

  it('calls jwtVerify with the token and encoded secret', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { email: 'a', paymentIntentId: 'b' } });

    await Effect.runPromise(verifySession('my.token'));

    expect(mockJwtVerify).toHaveBeenCalledWith('my.token', expect.any(Uint8Array));
  });

  it('returns SessionError when verification fails with an Error', async () => {
    mockJwtVerify.mockRejectedValue(new Error('invalid signature'));

    const result = await Effect.runPromise(Effect.flip(verifySession('bad.token')));

    expect(result._tag).toBe('SessionError');
    expect(result.message).toBe('invalid signature');
  });

  it('returns SessionError with stringified message for non-Error rejection', async () => {
    mockJwtVerify.mockRejectedValue('token expired');

    const result = await Effect.runPromise(Effect.flip(verifySession('expired.token')));

    expect(result._tag).toBe('SessionError');
    expect(result.message).toBe('token expired');
  });
});
