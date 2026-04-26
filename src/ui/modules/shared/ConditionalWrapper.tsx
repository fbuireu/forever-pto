import type { ElementType, HTMLAttributes, ReactNode } from 'react';

interface ConditionalWrapperHTMLProps<T extends ElementType = 'div'> {
  doWrap: boolean;
  as?: T;
  wrapperProps?: HTMLAttributes<HTMLElement>;
  children: ReactNode;
}

interface ConditionalWrapperCustomProps {
  doWrap: boolean;
  wrapper: (children: ReactNode) => ReactNode;
  children: ReactNode;
}

type ConditionalWrapperProps<T extends ElementType = 'div'> =
  | ConditionalWrapperHTMLProps<T>
  | ConditionalWrapperCustomProps;

export function ConditionalWrapper<T extends ElementType = 'div'>(props: Readonly<ConditionalWrapperProps<T>>) {
  if (!props.doWrap) return <>{props.children}</>;

  if ('wrapper' in props) {
    return <>{props.wrapper(props.children)}</>;
  }

  const Component = props.as ?? 'div';
  return <Component {...props.wrapperProps}>{props.children}</Component>;
}
