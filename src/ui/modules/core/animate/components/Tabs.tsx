'use client';

import { AutoHeight } from '@ui/modules/core/animate/effects/AutoHeight';
import { cn } from '@ui/utils/utils';
import { AnimatePresence, type HTMLMotionProps, m, type Transition } from 'motion/react';
import * as React from 'react';
import { createContext, use, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { MotionHighlight, MotionHighlightItem } from '../effects/MotionHighlight';

type TabsContextType = {
  activeValue: string;
  handleValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs(): TabsContextType {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error('useTabs must be used within a Tabs');
  return ctx;
}

type TabsProps = React.ComponentProps<'div'> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

function Tabs({ defaultValue, value, onValueChange, children, className, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  const handleValueChange = useCallback(
    (val: string) => {
      if (!isControlled) setInternalValue(val);
      onValueChange?.(val);
    },
    [isControlled, onValueChange]
  );

  const contextValue = useMemo(() => ({ activeValue, handleValueChange }), [activeValue, handleValueChange]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div data-slot='tabs' className={cn('flex flex-col gap-2', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

type TabsHighlightProps = {
  children: React.ReactNode;
  activeClassName?: string;
  transition?: Transition;
};

function TabsHighlight({
  children,
  activeClassName,
  transition = { type: 'spring', stiffness: 200, damping: 25 },
}: TabsHighlightProps) {
  const { activeValue } = useTabs();

  return (
    <MotionHighlight
      controlledItems
      className={cn(
        'rounded-[6px] bg-[var(--accent)] border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-xs)]',
        activeClassName
      )}
      value={activeValue}
      transition={transition}
    >
      {children}
    </MotionHighlight>
  );
}

type TabsListProps = React.ComponentProps<'div'>;

function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div
      role='tablist'
      data-slot='tabs-list'
      className={cn(
        'bg-[var(--surface-panel-soft)] gap-1 text-muted-foreground inline-flex h-10 w-fit items-center justify-center rounded-[10px] border-[3px] border-[var(--frame)] p-[3px] shadow-[var(--shadow-brutal-xs)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type TabsHighlightItemProps = {
  value: string;
  children: React.ReactElement;
  className?: string;
};

function TabsHighlightItem({ value, children, className }: TabsHighlightItemProps) {
  return (
    <MotionHighlightItem value={value} className={cn('size-full', className)}>
      {children}
    </MotionHighlightItem>
  );
}

type TabsTriggerProps = HTMLMotionProps<'button'> & { value: string };

function TabsTrigger({ ref, value, children, className, ...props }: TabsTriggerProps) {
  const { activeValue, handleValueChange } = useTabs();
  const localRef = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLButtonElement);

  return (
    <m.button
      ref={localRef}
      data-slot='tabs-trigger'
      role='tab'
      whileTap={{ scale: 0.95 }}
      onClick={() => handleValueChange(value)}
      data-state={activeValue === value ? 'active' : 'inactive'}
      className={cn(
        'inline-flex cursor-pointer items-center size-full justify-center whitespace-nowrap rounded-sm px-2 py-1 text-sm font-medium transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground z-[1]',
        className
      )}
      {...props}
    >
      {children}
    </m.button>
  );
}

type TabsContentsProps = Omit<HTMLMotionProps<'div'>, 'children' | 'transition'> & {
  children?: React.ReactNode;
  mode?: 'auto-height' | 'layout';
  transition?: Transition;
};

function TabsContents({
  children,
  className,
  mode = 'auto-height',
  transition = { type: 'spring', stiffness: 200, damping: 25 },
  ...props
}: TabsContentsProps) {
  const { activeValue } = useTabs();
  const activeChild = React.Children.toArray(children).find(
    (child): child is React.ReactElement<TabsContentProps> =>
      React.isValidElement<TabsContentProps>(child) && child.props.value === activeValue
  );

  const content = (
    <AnimatePresence initial={false} mode='wait'>
      {activeChild ? React.cloneElement(activeChild, { key: activeValue }) : null}
    </AnimatePresence>
  );

  if (mode === 'layout') {
    return (
      <m.div data-slot='tabs-contents' layout className={cn(className)} transition={transition} {...props}>
        {content}
      </m.div>
    );
  }

  return (
    <AutoHeight
      data-slot='tabs-contents'
      className={cn(className)}
      deps={[activeValue]}
      transition={transition}
      {...props}
    >
      {content}
    </AutoHeight>
  );
}

type TabsContentProps = Omit<HTMLMotionProps<'div'>, 'value'> & {
  value: string;
  transition?: Transition;
};

function TabsContent({
  value: _value,
  children,
  className,
  transition = { duration: 0.22, ease: 'easeOut' },
  ...props
}: TabsContentProps) {
  return (
    <m.div
      role='tabpanel'
      data-slot='tabs-content'
      initial={{ opacity: 0, filter: 'blur(4px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(4px)' }}
      transition={transition}
      className={cn('outline-none', className)}
      {...props}
    >
      {children}
    </m.div>
  );
}

export {
  Tabs,
  TabsContent,
  type TabsContentProps,
  TabsContents,
  type TabsContentsProps,
  type TabsContextType,
  TabsHighlight,
  TabsHighlightItem,
  type TabsHighlightItemProps,
  type TabsHighlightProps,
  TabsList,
  type TabsListProps,
  type TabsProps,
  TabsTrigger,
  type TabsTriggerProps,
  useTabs,
};
