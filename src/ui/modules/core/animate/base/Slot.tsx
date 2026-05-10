import { mergeProps } from '@base-ui/react/merge-props';
import * as React from 'react';

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
};

const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...slotProps }, forwardedRef) => {
  if (!React.isValidElement(children)) return null;

  const { ref: childRef, ...childProps } = children.props as Record<string, unknown> & { ref?: React.Ref<HTMLElement> };

  const merged = mergeProps(slotProps as never, childProps as never) as React.HTMLAttributes<HTMLElement>;

  const composedRef =
    childRef && forwardedRef
      ? (node: HTMLElement | null) => {
          if (typeof childRef === 'function') childRef(node);
          else (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      : (childRef ?? forwardedRef ?? undefined);

  return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, { ...merged, ref: composedRef });
});
Slot.displayName = 'Slot';

export { Slot };
