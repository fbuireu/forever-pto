import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Slot } from './Slot';

describe('Slot', () => {
  it('returns null when children is not a valid element', () => {
    const { container } = render(<Slot>{'plain text'}</Slot>);
    expect(container.firstChild).toBeNull();
  });

  it('renders the child element', () => {
    const { getByTestId } = render(
      <Slot>
        <div data-testid='child' />
      </Slot>
    );
    expect(getByTestId('child')).toBeTruthy();
  });

  it('merges slot className onto the child', () => {
    const { container } = render(
      <Slot className='slot-class'>
        <div data-testid='merge-test' className='child-class' />
      </Slot>
    );
    const el = container.querySelector('[data-testid="merge-test"]') as HTMLElement;
    expect(el.className).toContain('slot-class');
    expect(el.className).toContain('child-class');
  });

  it('forwards a ref object to the child', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Slot ref={ref}>
        <div />
      </Slot>
    );
    expect(ref.current).not.toBeNull();
  });

  it('forwards a callback ref to the child', () => {
    const cbRef = vi.fn();
    render(
      <Slot ref={cbRef}>
        <div />
      </Slot>
    );
    expect(cbRef).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('composes slot ref and child ref so both receive the same node', () => {
    const slotRef = createRef<HTMLDivElement>();
    const childRef = createRef<HTMLDivElement>();
    render(
      <Slot ref={slotRef}>
        <div ref={childRef} />
      </Slot>
    );
    expect(slotRef.current).not.toBeNull();
    expect(slotRef.current).toBe(childRef.current);
  });

  it('composes slot callback ref and child callback ref', () => {
    const slotCb = vi.fn();
    const childCb = vi.fn();
    render(
      <Slot ref={slotCb}>
        <div ref={childCb} />
      </Slot>
    );
    expect(slotCb).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    expect(childCb).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });
});
