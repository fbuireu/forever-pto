'use client';

import { AutoHeight } from '@ui/modules/core/animate/effects/AutoHeight';
import { cn } from '@ui/utils/cn';
import { AnimatePresence, type HTMLMotionProps, m, type Transition } from 'motion/react';
import { type ComponentProps, type ReactElement, type ReactNode, Children, cloneElement, createContext, isValidElement, use, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { MotionHighlight, MotionHighlightItem } from '../effects/MotionHighlight';

type TabsContextType = {
  activeValue: string;
  handleValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error('useTabs must be used within a Tabs');
  return ctx;
}

type TabsProps = ComponentProps<'div'> & {
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
  children: ReactNode;
  activeClassName?: string;
  transition?: Transition;
};

function TabsHighlight({
  children,
  activeClassName,
  transition = { type: 'spring', stiffness: 200, damping: 25 },
}: Readonly<TabsHighlightProps>) {
  const { activeValue } = useTabs();

  return (
    <MotionHighlight
      controlledItems
      className={cn(
        'rounded-md bg-accent border-2 border-(--frame) shadow-(--shadow-brutal-xs)',
        activeClassName
      )}
      value={activeValue}
      transition={transition}
    >
      {children}
    </MotionHighlight>
  );
}

type TabsListProps = ComponentProps<'div'>;

function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div
      role='tablist'
      data-slot='tabs-list'
      className={cn(
        'bg-(--surface-panel-soft) gap-1 text-muted-foreground inline-flex h-10 w-fit items-center justify-center rounded-xl border-[3px] border-(--frame) p-0.75 shadow-(--shadow-brutal-xs)',
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
  children: ReactElement;
  className?: string;
};

function TabsHighlightItem({ value, children, className }: Readonly<TabsHighlightItemProps>) {
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
        'inline-flex cursor-pointer items-center size-full justify-center whitespace-nowrap rounded-sm px-2 py-1 text-sm font-medium transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-accent-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground z-1',
        className
      )}
      {...props}
    >
      {children}
    </m.button>
  );
}

type TabsContentsProps = Omit<HTMLMotionProps<'div'>, 'children' | 'transition'> & {
  children?: ReactNode;
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
  const childrenArray = Children.toArray(children);
  const allValues = childrenArray.map((child) =>
    isValidElement<TabsContentProps>(child) ? child.props.value : ''
  );
  const activeIndex = allValues.indexOf(activeValue);

  const prevValueRef = useRef(activeValue);
  const prevIndex = allValues.indexOf(prevValueRef.current);
  const direction = activeIndex >= prevIndex ? 1 : -1;

  useEffect(() => {
    prevValueRef.current = activeValue;
  }, [activeValue]);

  const activeChild = childrenArray.find(
    (child): child is ReactElement<TabsContentProps> =>
      isValidElement<TabsContentProps>(child) && child.props.value === activeValue
  );

  const content = (
    <AnimatePresence initial={false} mode='wait' custom={direction}>
      {activeChild ? cloneElement(activeChild, { key: activeValue, custom: direction }) : null}
    </AnimatePresence>
  );

  if (mode === 'layout') {
    return (
      <m.div data-slot='tabs-contents' layout className={cn('overflow-hidden', className)} transition={transition} {...props}>
        {content}
      </m.div>
    );
  }

  return (
    <AutoHeight
      data-slot='tabs-contents'
      className={cn('overflow-hidden', className)}
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

const tabsContentVariants = {
  enter: (dir: number) => ({ x: `${dir * 100}%`, opacity: 0, filter: 'blur(4px)' }),
  center: { x: '0%', opacity: 1, filter: 'blur(0px)' },
  exit: (dir: number) => ({ x: `${dir * -100}%`, opacity: 0, filter: 'blur(4px)' }),
};

function TabsContent({
  value: _value,
  children,
  className,
  transition = { type: 'spring', stiffness: 300, damping: 30, bounce: 0 },
  ...props
}: TabsContentProps) {
  return (
    <m.div
      role='tabpanel'
      data-slot='tabs-content'
      variants={tabsContentVariants}
      initial='enter'
      animate='center'
      exit='exit'
      transition={transition}
      className={cn('outline-none', className)}
      {...props}
    >
      {children}
    </m.div>
  );
}

export { Tabs, TabsContent, TabsContents, TabsHighlight, TabsHighlightItem, TabsList, TabsTrigger };
