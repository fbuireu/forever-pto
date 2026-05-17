import { renderHook } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@ui/hooks/useMobile', () => ({ useIsMobile: () => false }));
vi.mock('@ui/utils/cookie', () => ({ setCookie: vi.fn().mockResolvedValue(undefined) }));

type MotionDivProps = React.ComponentProps<'div'> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  layout?: unknown;
  whileTap?: unknown;
  whileHover?: unknown;
};

vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react');
  return {
    m: {
      div: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, layout: _l, whileTap: _wt, whileHover: _wh, style, ...props }: MotionDivProps) =>
        createElement('div', { style, ...props }, children),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => createElement(Fragment, null, children),
  };
});

vi.mock('../effects/MotionHighlight', () => ({
  MotionHighlight: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  MotionHighlightItem: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../icons/PanelLeft', () => ({ PanelLeftIcon: () => <svg /> }));

vi.mock('./Tooltip', () => ({
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, ...props }: React.ComponentProps<'button'>) => <button {...props}>{children}</button>,
}));

import { SidebarProvider, useSidebar } from './Sidebar';

describe('useSidebar', () => {
  it('throws when used outside SidebarProvider', () => {
    expect(() => renderHook(() => useSidebar())).toThrow(
      'useSidebar must be used within a SidebarProvider.'
    );
  });
});

describe('SidebarProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SidebarProvider>{children}</SidebarProvider>
  );

  it('provides open=true by default', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.open).toBe(true);
  });

  it('provides state="expanded" when open=true', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.state).toBe('expanded');
  });

  it('provides state="collapsed" when defaultOpen=false', () => {
    const collapsedWrapper = ({ children }: { children: React.ReactNode }) => (
      <SidebarProvider defaultOpen={false}>{children}</SidebarProvider>
    );
    const { result } = renderHook(() => useSidebar(), { wrapper: collapsedWrapper });
    expect(result.current.state).toBe('collapsed');
    expect(result.current.open).toBe(false);
  });

  it('provides isMobile=false (mocked)', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isMobile).toBe(false);
  });

  it('provides a toggleSidebar function', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(typeof result.current.toggleSidebar).toBe('function');
  });

  it('provides openMobile=false initially', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.openMobile).toBe(false);
  });
});
