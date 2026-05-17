import { render } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

type MockProps = { children?: ReactNode; className?: string };

vi.mock('../primitives/base/Dialog', () => ({
  Dialog: ({ children, ...props }: ComponentProps<'div'>) => <div data-primitive='dialog' {...props}>{children}</div>,
  DialogTrigger: ({ children, ...props }: ComponentProps<'button'>) => (
    <button data-primitive='dialog-trigger' {...props}>{children}</button>
  ),
  DialogPortal: ({ children }: MockProps) => <>{children}</>,
  DialogBackdrop: ({ className, ...props }: ComponentProps<'div'>) => (
    <div data-primitive='dialog-backdrop' className={className} {...props} />
  ),
  DialogPopup: ({ className, children, ...props }: ComponentProps<'div'>) => (
    <div data-primitive='dialog-popup' className={className} {...props}>
      {children}
    </div>
  ),
  DialogClose: ({ children, className, ...props }: ComponentProps<'button'>) => (
    <button data-primitive='dialog-close' className={className} {...props}>
      {children}
    </button>
  ),
  DialogHeader: ({ children, className, ...props }: ComponentProps<'div'>) => (
    <div data-primitive='dialog-header' className={className} {...props}>
      {children}
    </div>
  ),
  DialogFooter: ({ children, className, ...props }: ComponentProps<'div'>) => (
    <div data-primitive='dialog-footer' className={className} {...props}>
      {children}
    </div>
  ),
  DialogTitle: ({ children, className, ...props }: ComponentProps<'div'>) => (
    <div data-primitive='dialog-title' className={className} {...props}>
      {children}
    </div>
  ),
  DialogDescription: ({ children, className, ...props }: ComponentProps<'div'>) => (
    <div data-primitive='dialog-description' className={className} {...props}>
      {children}
    </div>
  ),
}));

vi.mock('lucide-react', () => ({ XIcon: () => <svg data-testid='x-icon' /> }));

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog';

describe('Dialog', () => {
  it('renders without throwing', () => {
    expect(() => render(<Dialog><span /></Dialog>)).not.toThrow();
  });
});

describe('DialogTrigger', () => {
  it('renders without throwing', () => {
    expect(() => render(<DialogTrigger>open</DialogTrigger>)).not.toThrow();
  });
});

describe('DialogContent (DialogPopup)', () => {
  it('renders the close button by default', () => {
    const { container } = render(<DialogContent>body</DialogContent>);
    expect(container.querySelector('[data-testid="x-icon"]')).not.toBeNull();
  });

  it('hides the close button when showCloseButton=false', () => {
    const { container } = render(<DialogContent showCloseButton={false}>body</DialogContent>);
    expect(container.querySelector('[data-testid="x-icon"]')).toBeNull();
  });

  it('merges className onto the popup', () => {
    const { container } = render(<DialogContent className='custom-class'>body</DialogContent>);
    const popup = container.querySelector('[data-primitive="dialog-popup"]');
    expect(popup?.className).toContain('custom-class');
  });
});

describe('DialogHeader', () => {
  it('applies className', () => {
    const { container } = render(<DialogHeader className='hdr-class'>header</DialogHeader>);
    expect(container.querySelector('[data-primitive="dialog-header"]')?.className).toContain('hdr-class');
  });
});

describe('DialogFooter', () => {
  it('applies className', () => {
    const { container } = render(<DialogFooter className='ftr-class'>footer</DialogFooter>);
    expect(container.querySelector('[data-primitive="dialog-footer"]')?.className).toContain('ftr-class');
  });
});

describe('DialogTitle', () => {
  it('applies className', () => {
    const { container } = render(<DialogTitle className='ttl-class'>title</DialogTitle>);
    expect(container.querySelector('[data-primitive="dialog-title"]')?.className).toContain('ttl-class');
  });
});

describe('DialogDescription', () => {
  it('applies className', () => {
    const { container } = render(<DialogDescription className='desc-class'>desc</DialogDescription>);
    expect(container.querySelector('[data-primitive="dialog-description"]')?.className).toContain('desc-class');
  });
});
