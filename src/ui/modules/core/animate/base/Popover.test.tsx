import { render } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../primitives/base/Popover', () => ({
  Popover: ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div data-primitive='popover' {...props}>{children}</div>
  ),
  PopoverTrigger: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button data-primitive='popover-trigger' {...props}>
      {children}
    </button>
  ),
  PopoverPortal: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  PopoverPositioner: ({
    children,
    align,
    sideOffset,
    className,
    ...props
  }: React.ComponentProps<'div'> & { align?: string; sideOffset?: number }) => (
    <div
      data-primitive='popover-positioner'
      data-align={align}
      data-side-offset={sideOffset}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  PopoverPopup: ({
    children,
    className,
    initialFocus: _if,
    finalFocus: _ff,
    style,
    ...props
  }: React.ComponentProps<'div'> & { initialFocus?: unknown; finalFocus?: unknown }) => (
    <div data-primitive='popover-popup' className={className} style={style} {...props}>
      {children}
    </div>
  ),
}));

import { Popover, PopoverContent, PopoverTrigger } from './Popover';

describe('Popover', () => {
  it('renders without throwing', () => {
    expect(() => render(<Popover><span /></Popover>)).not.toThrow();
  });
});

describe('PopoverTrigger', () => {
  it('renders without throwing', () => {
    expect(() => render(<PopoverTrigger>open</PopoverTrigger>)).not.toThrow();
  });
});

describe('PopoverContent', () => {
  it('renders without throwing', () => {
    expect(() => render(<PopoverContent>content</PopoverContent>)).not.toThrow();
  });

  it('applies className onto the popup', () => {
    const { container } = render(<PopoverContent className='custom-class'>content</PopoverContent>);
    expect(container.querySelector('[data-primitive="popover-popup"]')?.className).toContain('custom-class');
  });

  it('passes align to the positioner (default center)', () => {
    const { container } = render(<PopoverContent>content</PopoverContent>);
    expect(container.querySelector<HTMLElement>('[data-primitive="popover-positioner"]')?.dataset.align).toBe('center');
  });

  it('passes sideOffset to the positioner (default 4)', () => {
    const { container } = render(<PopoverContent>content</PopoverContent>);
    expect(container.querySelector<HTMLElement>('[data-primitive="popover-positioner"]')?.dataset.sideOffset).toBe('4');
  });

  it('respects a custom align', () => {
    const { container } = render(<PopoverContent align='start'>content</PopoverContent>);
    expect(container.querySelector<HTMLElement>('[data-primitive="popover-positioner"]')?.dataset.align).toBe('start');
  });

  it('applies positionerClassName to the positioner', () => {
    const { container } = render(<PopoverContent positionerClassName='positioner-class'>content</PopoverContent>);
    expect(container.querySelector('[data-primitive="popover-positioner"]')?.className).toContain('positioner-class');
  });
});
