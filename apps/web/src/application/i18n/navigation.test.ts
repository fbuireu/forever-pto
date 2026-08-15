import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLink = vi.fn();
const mockUsePathname = vi.fn();
const mockUseRouter = vi.fn();
const mockCreateNavigation = vi.fn().mockReturnValue({
  Link: mockLink,
  usePathname: mockUsePathname,
  useRouter: mockUseRouter,
});

vi.mock('next-intl/navigation', () => ({ createNavigation: mockCreateNavigation }));

vi.mock('@infrastructure/i18n/routing', async () => {
  const { LOCALES, EN } = await import('@infrastructure/i18n/locales');
  return { routing: { locales: LOCALES, defaultLocale: EN } };
});

describe('navigation', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateNavigation.mockReturnValue({
      Link: mockLink,
      usePathname: mockUsePathname,
      useRouter: mockUseRouter,
    });
  });

  it('calls createNavigation with the routing config', async () => {
    const { routing } = await import('@infrastructure/i18n/routing');
    await import('./navigation');
    expect(mockCreateNavigation).toHaveBeenCalledWith(routing);
  });

  it('exports Link, usePathname, and useRouter from createNavigation', async () => {
    const { Link, usePathname, useRouter } = await import('./navigation');
    expect(Link).toBe(mockLink);
    expect(usePathname).toBe(mockUsePathname);
    expect(useRouter).toBe(mockUseRouter);
  });
});
