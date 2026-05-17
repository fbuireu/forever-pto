import { render } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../primitives/base/Tooltip', () => ({
  TooltipProvider: ({ children, delay, ...props }: React.ComponentProps<'div'> & { delay?: number }) => (
    <div data-primitive='tooltip-provider' data-delay={delay} {...props}>
      {children}
    </div>
  ),
  Tooltip: ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div data-primitive='tooltip' {...props}>
      {children}
    </div>
  ),
  TooltipTrigger: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button data-primitive='tooltip-trigger' {...props}>
      {children}
    </button>
  ),
  TooltipPortal: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  TooltipPositioner: ({
    children,
    sideOffset,
    className,
    ...props
  }: React.ComponentProps<'div'> & { sideOffset?: number }) => (
    <div data-primitive='tooltip-positioner' data-side-offset={sideOffset} className={className} {...props}>
      {children}
    </div>
  ),
  TooltipPopup: ({
    children,
    className,
    style,
    ...props
  }: React.ComponentProps<'div'>) => (
    <div data-primitive='tooltip-popup' className={className} style={style} {...props}>
      {children}
    </div>
  ),
  TooltipArrow: (props: React.ComponentProps<'div'>) => <div data-primitive='tooltip-arrow' {...props} />,
}));

import { Tooltip, TooltipContent, TooltipInfoTrigger, TooltipProvider, TooltipTrigger } from './Tooltip';

describe('TooltipProvider', () => {
  it('defaults delay to 0', () => {
    const { container } = render(<TooltipProvider />);
    expect(container.querySelector<HTMLElement>('[data-primitive="tooltip-provider"]')?.dataset.delay).toBe('0');
  });

  it('passes delayDuration as delay to the primitive', () => {
    const { container } = render(<TooltipProvider delayDuration={500} />);
    expect(container.querySelector<HTMLElement>('[data-primitive="tooltip-provider"]')?.dataset.delay).toBe('500');
  });

  it('delayDuration takes precedence over delay', () => {
    const { container } = render(<TooltipProvider delay={100} delayDuration={300} />);
    expect(container.querySelector<HTMLElement>('[data-primitive="tooltip-provider"]')?.dataset.delay).toBe('300');
  });
});

describe('Tooltip', () => {
  it('wraps content in a TooltipProvider with the resolved delay', () => {
    const { container } = render(<Tooltip delayDuration={200}><span /></Tooltip>);
    expect(container.querySelector<HTMLElement>('[data-primitive="tooltip-provider"]')?.dataset.delay).toBe('200');
  });

  it('defaults delay to 0', () => {
    const { container } = render(<Tooltip><span /></Tooltip>);
    expect(container.querySelector<HTMLElement>('[data-primitive="tooltip-provider"]')?.dataset.delay).toBe('0');
  });
});

describe('TooltipTrigger', () => {
  it('renders without throwing', () => {
    expect(() => render(<TooltipTrigger>hover me</TooltipTrigger>)).not.toThrow();
  });
});

describe('TooltipContent', () => {
  it('applies className onto the popup', () => {
    const { container } = render(<TooltipContent className='custom-class'>tip</TooltipContent>);
    expect(container.querySelector('[data-primitive="tooltip-popup"]')?.className).toContain('custom-class');
  });

  it('passes sideOffset to the positioner (default 4)', () => {
    const { container } = render(<TooltipContent>tip</TooltipContent>);
    expect(container.querySelector<HTMLElement>('[data-primitive="tooltip-positioner"]')?.dataset.sideOffset).toBe('4');
  });

  it('renders the arrow', () => {
    const { container } = render(<TooltipContent>tip</TooltipContent>);
    expect(container.querySelector('[data-primitive="tooltip-arrow"]')).not.toBeNull();
  });
});

describe('TooltipInfoTrigger', () => {
  it('renders with the "i" label', () => {
    const { getByText } = render(<TooltipInfoTrigger />);
    expect(getByText('i')).toBeTruthy();
  });

  it('applies additional className', () => {
    const { container } = render(<TooltipInfoTrigger className='extra' />);
    expect(container.querySelector('[data-primitive="tooltip-trigger"]')?.className).toContain('extra');
  });
});
