'use client';

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { cn } from '@ui/utils/utils';
import { type HTMLMotionProps, m, type Transition } from 'motion/react';
import * as React from 'react';
import { createContext, use, useCallback, useState } from 'react';

type CollapsibleContextType = {
  isOpen: boolean;
};

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

const useCollapsible = (): CollapsibleContextType => {
  const context = use(CollapsibleContext);
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible');
  }
  return context;
};

type CollapsibleProps = React.ComponentProps<typeof CollapsiblePrimitive.Root>;

function Collapsible({ children, ...props }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(props?.open ?? props?.defaultOpen ?? false);

  React.useEffect(() => {
    if (props?.open !== undefined) setIsOpen(props.open);
  }, [props?.open]);

  const handleOpenChange = useCallback(
    (...args: Parameters<NonNullable<CollapsibleProps['onOpenChange']>>) => {
      setIsOpen(args[0]);
      props.onOpenChange?.(...args);
    },
    [props.onOpenChange]
  );

  return (
    <CollapsibleContext.Provider value={{ isOpen }}>
      <CollapsiblePrimitive.Root data-slot='collapsible' {...props} onOpenChange={handleOpenChange}>
        {children}
      </CollapsiblePrimitive.Root>
    </CollapsibleContext.Provider>
  );
}

type CollapsibleTriggerProps = React.ComponentProps<typeof CollapsiblePrimitive.Trigger> & { asChild?: boolean };

function CollapsibleTrigger({ asChild, children, className, ...props }: CollapsibleTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <CollapsiblePrimitive.Trigger
        data-slot='collapsible-trigger'
        render={children as React.ReactElement}
        {...props}
      />
    );
  }
  return (
    <CollapsiblePrimitive.Trigger
      data-slot='collapsible-trigger'
      className={cn(
        "relative inline-flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel)] px-3 py-2 text-sm font-semibold shadow-[var(--shadow-brutal-btn)] outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-75 ease-linear before:content-[''] before:absolute before:inset-0 before:-bottom-2 before:-right-2",
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[var(--surface-panel-alt)] hover:shadow-[var(--shadow-brutal-btn-hover)]',
        'active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]',
        'aria-expanded:-translate-x-0.5 aria-expanded:-translate-y-0.5 aria-expanded:shadow-[var(--shadow-brutal-btn-hover)]',
        'focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Trigger>
  );
}

type CollapsibleContentProps = Omit<React.ComponentProps<typeof CollapsiblePrimitive.Panel>, 'render'> &
  HTMLMotionProps<'div'> & {
    transition?: Transition;
  };

function CollapsibleContent({
  className,
  children,
  transition = { type: 'spring', stiffness: 150, damping: 22 },
  ...props
}: CollapsibleContentProps) {
  return (
    <CollapsiblePrimitive.Panel
      keepMounted
      data-slot='collapsible-content'
      render={(panelProps: React.ComponentPropsWithoutRef<'div'> & { hidden?: boolean }, state: { open: boolean }) => {
        const {
          hidden: _hidden,
          style,
          className: panelClassName,
          onDrag: _onDrag,
          onDragEnd: _onDragEnd,
          onDragStart: _onDragStart,
          onDragEnter: _onDragEnter,
          onDragLeave: _onDragLeave,
          onDragOver: _onDragOver,
          onDrop: _onDrop,
          onAnimationStart: _onAnimationStart,
          ...restProps
        } = panelProps;
        return (
          <m.div
            {...restProps}
            layout
            animate={state.open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
            initial={false}
            transition={transition}
            aria-hidden={!state.open || undefined}
            className={cn('overflow-hidden', panelClassName, className)}
            style={{ display: 'block', ...style }}
          >
            {children}
          </m.div>
        );
      }}
      {...(props as React.ComponentProps<typeof CollapsiblePrimitive.Panel>)}
    />
  );
}

export {
  Collapsible,
  CollapsibleContent,
  type CollapsibleContentProps,
  type CollapsibleContextType,
  type CollapsibleProps,
  CollapsibleTrigger,
  type CollapsibleTriggerProps,
  useCollapsible,
};
