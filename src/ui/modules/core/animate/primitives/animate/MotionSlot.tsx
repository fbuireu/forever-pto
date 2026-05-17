'use client';

import { cn } from '@ui/utils/cn';
import { type HTMLMotionProps, isMotionComponent, m } from 'motion/react';
import { type CSSProperties, type ElementType, type Ref, type ReactElement, type RefCallback, isValidElement, useMemo } from 'react';

type AnyProps = Record<string, unknown>;

type DOMMotionProps<T extends HTMLElement = HTMLElement> = Omit<HTMLMotionProps<keyof HTMLElementTagNameMap>, 'ref'> & {
  ref?: Ref<T>;
};

type WithAsChild<Base extends object> =
  | (Base & { asChild: true; children: ReactElement })
  | (Base & { asChild?: false | undefined });

type MotionSlotProps<T extends HTMLElement = HTMLElement> = {
  children: ReactElement;
} & DOMMotionProps<T>;

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref).current = node;
      }
    });
  };
}

function mergeProps<T extends HTMLElement>(childProps: AnyProps, slotProps: DOMMotionProps<T>) {
  const merged: AnyProps = { ...childProps, ...slotProps };

  if (childProps.className || slotProps.className) {
    merged.className = cn(childProps.className as string, slotProps.className as string);
  }

  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style as CSSProperties),
      ...(slotProps.style as CSSProperties),
    };
  }

  return merged;
}

function MotionSlot<T extends HTMLElement = HTMLElement>({ children, ref, ...props }: MotionSlotProps<T>) {
  const isAlreadyMotion =
    typeof children.type === 'object' && children.type !== null && isMotionComponent(children.type);

  const Base = useMemo(
    () => (isAlreadyMotion ? (children.type as ElementType) : m.create(children.type as ElementType)),
    [isAlreadyMotion, children.type]
  );

  if (!isValidElement(children)) return null;

  const { ref: childRef, ...childProps } = children.props as AnyProps;

  const mergedProps = mergeProps(childProps, props);

  return <Base {...mergedProps} ref={mergeRefs(childRef as Ref<T>, ref)} />;
}

export { MotionSlot, type WithAsChild };
