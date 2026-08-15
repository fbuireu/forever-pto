import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.mock('next/cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/cache')>();
  return { ...actual, cacheLife: vi.fn(), cacheTag: vi.fn() };
});

afterEach(cleanup);
