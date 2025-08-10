import type { ElementType, HTMLAttributes, ReactNode } from 'react';

interface ConditionalWrapperProps<T extends ElementType = 'div'> {
  doWrap: boolean;
  as?: T;
  wrapperProps?: HTMLAttributes<HTMLElement>;
  children: ReactNode;
}

export function ConditionalWrapper<T extends ElementType = 'div'>({
  doWrap,
  as,
  wrapperProps,
  children,
}: Readonly<ConditionalWrapperProps<T>>) {
  if (!doWrap) return <>{children}</>;

  const Component = as ?? 'div';
  return <Component {...wrapperProps}>{children}</Component>;
}
