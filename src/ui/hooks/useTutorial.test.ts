import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockToggleSidebar = vi.hoisted(() => vi.fn());
const mockStart = vi.hoisted(() => vi.fn());
const mockGetDriverClientInstance = vi.hoisted(() => vi.fn(() => ({ start: mockStart })));
const mockUseIsMobile = vi.hoisted(() => vi.fn(() => false));
const mockUseSidebar = vi.hoisted(() => vi.fn(() => ({ open: true, toggleSidebar: mockToggleSidebar })));

vi.mock('@ui/hooks/useMobile', () => ({ useIsMobile: mockUseIsMobile }));
vi.mock('@ui/modules/core/animate/base/Sidebar', () => ({ useSidebar: mockUseSidebar }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@infrastructure/clients/tutorial/driver/client', () => ({
  getDriverClientInstance: mockGetDriverClientInstance,
}));
vi.mock('@ui/modules/tutorial/DriverStyles', () => ({}));

const { useTutorial } = await import('./useTutorial');

beforeEach(() => {
  vi.clearAllMocks();
  mockUseIsMobile.mockReturnValue(false);
  mockUseSidebar.mockReturnValue({ open: true, toggleSidebar: mockToggleSidebar });
});

describe('useTutorial', () => {
  it('returns a startTutorial function', () => {
    const { result } = renderHook(() => useTutorial());
    expect(typeof result.current.startTutorial).toBe('function');
  });

  it('starts the driver tutorial when sidebar is already open', async () => {
    const { result } = renderHook(() => useTutorial());

    await act(async () => {
      await result.current.startTutorial();
    });

    expect(mockStart).toHaveBeenCalledOnce();
    expect(mockStart).toHaveBeenCalledWith(expect.any(Array), expect.any(Object));
  });

  it('opens the sidebar before starting when it is closed', async () => {
    mockUseSidebar.mockReturnValue({ open: false, toggleSidebar: mockToggleSidebar });
    vi.spyOn(document, 'querySelector').mockReturnValueOnce(null);

    const { result } = renderHook(() => useTutorial());

    await act(async () => {
      await result.current.startTutorial();
    });

    expect(mockToggleSidebar).toHaveBeenCalled();
  });

  it('includes a mobile-specific step when on mobile', async () => {
    mockUseIsMobile.mockReturnValue(true);

    const { result } = renderHook(() => useTutorial());

    await act(async () => {
      await result.current.startTutorial();
    });

    const desktopStepCount = 10;
    const steps = mockStart.mock.lastCall![0] as unknown[];
    expect(steps.length).toBeGreaterThan(desktopStepCount);
  });

  it('passes translated button labels to driver start', async () => {
    const { result } = renderHook(() => useTutorial());

    await act(async () => {
      await result.current.startTutorial();
    });

    const options = mockStart.mock.lastCall![1] as Record<string, string>;
    expect(options).toHaveProperty('nextBtnText');
    expect(options).toHaveProperty('prevBtnText');
    expect(options).toHaveProperty('doneBtnText');
    expect(options).toHaveProperty('progressText');
  });
});
