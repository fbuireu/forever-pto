'use client';

import * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { type HTMLMotionProps, motion, type Transition } from 'motion/react';
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

function CollapsibleTrigger({ asChild, children, ...props }: CollapsibleTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <CollapsiblePrimitive.Trigger data-slot='collapsible-trigger' render={children as React.ReactElement} {...props} />
    );
  }
  return (
    <CollapsiblePrimitive.Trigger data-slot='collapsible-trigger' {...props}>
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render={(panelProps: any, state: { open: boolean }) => {
        // Destructure hidden so we control visibility via framer-motion instead
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hidden, style, className: panelClassName, ...restProps } = panelProps;
        return (
          <motion.div
            {...restProps}
            layout
            animate={state.open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
            initial={false}
            transition={transition}
            aria-hidden={!state.open || undefined}
            className={panelClassName ?? className}
            style={{ overflow: 'hidden', display: 'block', ...style }}
          >
            {children}
          </motion.div>
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
