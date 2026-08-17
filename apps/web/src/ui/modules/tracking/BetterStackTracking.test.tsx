import { act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAcceptedService, mockIdentifyUser } = vi.hoisted(() => ({
  mockAcceptedService: vi.fn(),
  mockIdentifyUser: vi.fn(),
}));

vi.mock('vanilla-cookieconsent', () => ({
  acceptedService: mockAcceptedService,
  acceptedCategory: vi.fn(() => true),
}));

vi.mock('@infrastructure/clients/logging/better-stack/tracking', () => ({
  identifyUser: mockIdentifyUser,
}));

vi.mock('@application/stores/premium', () => ({
  usePremiumStore: (selector: (state: unknown) => unknown) => selector({ userEmail: null, premiumKey: null }),
}));

vi.mock('next/script', () => ({
  default: ({ children, id }: { children?: ReactNode; id?: string }) => <script data-testid={id}>{children}</script>,
}));

process.env.NEXT_PUBLIC_BETTER_STACK_TRACKING_TOKEN = 'test-token';

const { BetterStackTracking } = await import('./BetterStackTracking');

beforeEach(() => {
  vi.clearAllMocks();
  mockAcceptedService.mockReturnValue(false);
});

describe('BetterStackTracking', () => {
  it('renders nothing while the betterStack service is refused', () => {
    const { container } = render(<BetterStackTracking />);

    expect(container.querySelector('script')).toBeNull();
    expect(mockAcceptedService).toHaveBeenCalledWith('betterStack', 'analytics');
  });

  it('mounts the snippet on a consent event dispatched on window', () => {
    const { container } = render(<BetterStackTracking />);
    expect(container.querySelector('script')).toBeNull();

    mockAcceptedService.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new CustomEvent('cc:onChange'));
    });

    expect(container.querySelector('script')).not.toBeNull();
  });

  it('ignores an event dispatched on document, which the library never uses', () => {
    const { container } = render(<BetterStackTracking />);

    mockAcceptedService.mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new CustomEvent('cc:onChange'));
    });

    expect(container.querySelector('script')).toBeNull();
  });
});
