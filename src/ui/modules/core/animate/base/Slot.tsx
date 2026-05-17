import { mergeProps } from '@base-ui/react/merge-props';
import { cloneElement, HTMLAttributes, isValidElement, ReactElement, ReactNode, Ref, RefObject } from 'react';

type SlotProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
};

function Slot({ children, ref: forwardedRef, ...slotProps }: SlotProps) {
  if (!isValidElement(children)) return null;

  const { ref: childRef, ...childProps } = children.props as Record<string, unknown> & { ref?: Ref<HTMLElement> };

  const merged = mergeProps(slotProps as never, childProps as never) as HTMLAttributes<HTMLElement>;

  const composedRef =
    childRef && forwardedRef
      ? (node: HTMLElement | null) => {
          if (typeof childRef === 'function') childRef(node);
          else (childRef as RefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else (forwardedRef as RefObject<HTMLElement | null>).current = node;
        }
      : (childRef ?? forwardedRef ?? undefined);

  return cloneElement(children as ReactElement<Record<string, unknown>>, { ...merged, ref: composedRef });
}

export { Slot };
