'use client';

import { Slot } from '@radix-ui/react-slot';
import { motion, type HTMLMotionProps, type Transition } from 'motion/react';
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getStrictContext } from 'src/lib/get-strict-context';
import { Highlight, HighlightItem, type HighlightItemProps, type HighlightProps } from '../effects/highlight';
import type { WithAsChild } from './slot';

type TabsContextType = {
  activeValue: string;
  handleValueChange: (value: string) => void;
  registerTrigger: (value: string, node: HTMLElement | null) => void;
};

const [TabsProvider, useTabs] = getStrictContext<TabsContextType>('TabsContext');

type BaseTabsProps = React.ComponentProps<'div'> & {
  children: React.ReactNode;
};

type UnControlledTabsProps = BaseTabsProps & {
  defaultValue?: string;
  value?: never;
  onValueChange?: never;
};

type ControlledTabsProps = BaseTabsProps & {
  value: string;
  onValueChange?: (value: string) => void;
  defaultValue?: never;
};

type TabsProps = UnControlledTabsProps | ControlledTabsProps;

function Tabs({ defaultValue, value, onValueChange, children, ...props }: TabsProps) {
  const [activeValue, setActiveValue] = useState<string | undefined>(defaultValue);
  const triggersRef = useRef(new Map<string, HTMLElement>());
  const initialSet = useRef(false);
  const isControlled = value !== undefined;

  useEffect(() => {
    if (!isControlled && activeValue === undefined && triggersRef.current.size > 0 && !initialSet.current) {
      const firstTab = triggersRef.current.keys().next().value;
      if (firstTab !== undefined) {
        setActiveValue(firstTab);
        initialSet.current = true;
      }
    }
  }, [activeValue, isControlled]);

  const registerTrigger = useCallback(
    (val: string, node: HTMLElement | null) => {
      if (node) {
        triggersRef.current.set(val, node);
        if (!isControlled && activeValue === undefined && !initialSet.current) {
          setActiveValue(val);
          initialSet.current = true;
        }
      } else {
        triggersRef.current.delete(val);
      }
    },
    [activeValue, isControlled]
  );

  const handleValueChange = useCallback(
    (val: string) => {
      if (!isControlled) setActiveValue(val);
      else onValueChange?.(val);
    },
    [isControlled, onValueChange]
  );

  const contextValue = useMemo(
    () => ({
      activeValue: (value ?? activeValue) as string,
      handleValueChange,
      registerTrigger,
    }),
    [value, activeValue, handleValueChange, registerTrigger]
  );

  return (
    <TabsProvider value={contextValue}>
      <div data-slot='tabs' {...props}>
        {children}
      </div>
    </TabsProvider>
  );
}

type TabsHighlightProps = Omit<HighlightProps, 'controlledItems' | 'value'>;

function TabsHighlight({ transition = { type: 'spring', stiffness: 200, damping: 25 }, ...props }: TabsHighlightProps) {
  const { activeValue } = useTabs();

  return (
    <Highlight
      data-slot='tabs-highlight'
      controlledItems
      value={activeValue}
      transition={transition}
      click={false}
      {...props}
    />
  );
}

type TabsListProps = React.ComponentProps<'div'> & {
  children: React.ReactNode;
};

function TabsList(props: TabsListProps) {
  return <div role='tablist' data-slot='tabs-list' {...props} />;
}

type TabsHighlightItemProps = HighlightItemProps & {
  value: string;
};

function TabsHighlightItem(props: TabsHighlightItemProps) {
  return <HighlightItem data-slot='tabs-highlight-item' {...props} />;
}

type TabsTriggerProps = WithAsChild<
  {
    value: string;
    children: React.ReactNode;
  } & HTMLMotionProps<'button'>
>;

function TabsTrigger({ ref, value, asChild = false, ...props }: TabsTriggerProps) {
  const { activeValue, handleValueChange, registerTrigger } = useTabs();

  const localRef = useRef<HTMLButtonElement | null>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLButtonElement);

  useEffect(() => {
    registerTrigger(value, localRef.current);
    return () => registerTrigger(value, null);
  }, [value, registerTrigger]);

  const commonProps = {
    ref: localRef,
    'data-slot': 'tabs-trigger' as const,
    role: 'tab' as const,
    onClick: () => handleValueChange(value),
    'data-state': activeValue === value ? ('active' as const) : ('inactive' as const),
  };

  if (asChild) {
    const { ...slotProps } = props;
    return <Slot {...commonProps} {...(slotProps as React.ComponentPropsWithRef<'button'>)} />;
  }

  return <motion.button {...commonProps} {...props} />;
}

type TabsContentsProps = HTMLMotionProps<'div'> & {
  children: React.ReactNode;
  transition?: Transition;
};

function TabsContents({
  children,
  transition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    bounce: 0,
    restDelta: 0.01,
  },
  ...props
}: TabsContentsProps) {
  const { activeValue } = useTabs();
  const childrenArray = Children.toArray(children);
  const activeIndex = childrenArray.findIndex(
    (child): child is React.ReactElement<{ value: string }> =>
      isValidElement(child) &&
      typeof child.props === 'object' &&
      child.props !== null &&
      'value' in child.props &&
      child.props.value === activeValue
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [height, setHeight] = useState(0);
  const roRef = useRef<ResizeObserver | null>(null);

  const measure = useCallback(() => {
    const pane = itemRefs.current[activeIndex];
    const container = containerRef.current;
    if (!pane || !container) return 0;

    const base = pane.getBoundingClientRect().height || 0;

    const cs = getComputedStyle(container);
    const isBorderBox = cs.boxSizing === 'border-box';
    const paddingY = (parseFloat(cs.paddingTop || '0') || 0) + (parseFloat(cs.paddingBottom || '0') || 0);
    const borderY = (parseFloat(cs.borderTopWidth || '0') || 0) + (parseFloat(cs.borderBottomWidth || '0') || 0);

    let total = base + (isBorderBox ? paddingY + borderY : 0);

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    total = Math.ceil(total * dpr) / dpr;

    return total;
  }, [activeIndex]);

  useEffect(() => {
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }

    const pane = itemRefs.current[activeIndex];
    const container = containerRef.current;
    if (!pane || !container) return;

    setHeight(measure());

    const ro = new ResizeObserver(() => {
      const next = measure();
      requestAnimationFrame(() => setHeight(next));
    });

    ro.observe(pane);
    ro.observe(container);

    roRef.current = ro;
    return () => {
      ro.disconnect();
      roRef.current = null;
    };
  }, [activeIndex, childrenArray.length, measure]);

  useLayoutEffect(() => {
    if (height === 0 && activeIndex >= 0) {
      const next = measure();
      if (next !== 0) setHeight(next);
    }
  }, [activeIndex, height, measure]);

  return (
    <motion.div
      ref={containerRef}
      data-slot='tabs-contents'
      style={{ overflow: 'hidden' }}
      animate={{ height }}
      transition={transition}
      {...props}
    >
      <motion.div className='flex -mx-2' animate={{ x: activeIndex * -100 + '%' }} transition={transition}>
        {childrenArray.map((child, index) => (
          <div
            key={String(child)}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className='w-full shrink-0 px-2 h-full'
          >
            {child}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

type TabsContentProps = WithAsChild<
  {
    value: string;
    children: React.ReactNode;
  } & HTMLMotionProps<'div'>
>;

function TabsContent({ value, style, asChild = false, ...props }: TabsContentProps) {
  const { activeValue } = useTabs();
  const isActive = activeValue === value;

  const commonProps = {
    role: 'tabpanel' as const,
    'data-slot': 'tabs-content' as const,
    inert: !isActive ? (true as unknown as undefined) : undefined,
    style: { overflow: 'hidden', ...style } as React.CSSProperties,
  };

  const motionProps = {
    initial: { filter: 'blur(0px)' },
    animate: { filter: isActive ? 'blur(0px)' : 'blur(4px)' },
    exit: { filter: 'blur(0px)' },
    transition: { type: 'spring' as const, stiffness: 200, damping: 25 },
  };

  if (asChild) {
    const { ...slotProps } = props;
    return <Slot {...commonProps} {...(slotProps as React.ComponentPropsWithRef<'div'>)} />;
  }

  return <motion.div {...commonProps} {...motionProps} {...props} />;
}

export {
  Tabs,
  TabsContent,
  TabsContents,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger,
  useTabs,
  type TabsContentProps,
  type TabsContentsProps,
  type TabsContextType,
  type TabsHighlightItemProps,
  type TabsHighlightProps,
  type TabsListProps,
  type TabsProps,
  type TabsTriggerProps,
};
