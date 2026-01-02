import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import { Fragment, type ComponentProps, type ReactNode } from 'react';
import { getStrictContext } from 'src/lib/get-strict-context';
import { Highlight, HighlightItem, type HighlightItemProps, type HighlightProps } from '../effects/highlight';
import { useControlledState } from '@ui/hooks/useControlledState';

type TabsContextType = {
  value: string | undefined;
  setValue: TabsProps['onValueChange'];
};

const [TabsProvider, useTabs] = getStrictContext<TabsContextType>('TabsContext');

type TabsProps = ComponentProps<typeof TabsPrimitive.Root>;

function Tabs(props: TabsProps) {
  const [value, setValue] = useControlledState({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: props.onValueChange,
  });

  return (
    <TabsProvider value={{ value, setValue }}>
      <TabsPrimitive.Root data-slot='tabs' {...props} onValueChange={setValue} />
    </TabsProvider>
  );
}

type TabsHighlightProps = Omit<HighlightProps, 'controlledItems' | 'value'>;

function TabsHighlight({ transition = { type: 'spring', stiffness: 200, damping: 25 }, ...props }: TabsHighlightProps) {
  const { value } = useTabs();

  return (
    <Highlight
      data-slot='tabs-highlight'
      controlledItems
      value={value}
      transition={transition}
      click={false}
      {...props}
    />
  );
}

type TabsListProps = ComponentProps<typeof TabsPrimitive.List>;

function TabsList(props: TabsListProps) {
  return <TabsPrimitive.List data-slot='tabs-list' {...props} />;
}

type TabsHighlightItemProps = HighlightItemProps & {
  value: string;
};

function TabsHighlightItem(props: TabsHighlightItemProps) {
  return <HighlightItem data-slot='tabs-highlight-item' {...props} />;
}

type TabsTabProps = ComponentProps<typeof TabsPrimitive.Tab>;

function TabsTab(props: TabsTabProps) {
  return <TabsPrimitive.Tab data-slot='tabs-tab' {...props} />;
}

type TabsPanelProps = ComponentProps<typeof TabsPrimitive.Panel> & HTMLMotionProps<'div'>;

function TabsPanel({
  value,
  keepMounted,
  transition = { duration: 0.5, ease: 'easeInOut' },
  ...props
}: TabsPanelProps) {
  return (
    <AnimatePresence mode='wait'>
      <TabsPrimitive.Panel
        render={
          <motion.div
            data-slot='tabs-panel'
            layout
            layoutDependency={value}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            transition={transition}
            {...props}
          />
        }
        keepMounted={keepMounted}
        value={value}
      />
    </AnimatePresence>
  );
}

type TabsPanelsProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
};

function TabsPanels({
  transition = { type: 'spring', stiffness: 200, damping: 30 },
  children,
  style,
  ...props
}: TabsPanelsProps) {
  const { value } = useTabs();

  return (
    <motion.div
      data-slot='tabs-panels'
      layout='size'
      layoutDependency={value}
      transition={{ layout: transition }}
      style={{ overflow: 'hidden', ...style }}
      {...props}
    >
      <Fragment key={value}>{children}</Fragment>
    </motion.div>
  );
}

export {
  Tabs,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsPanel,
  TabsPanels,
  TabsTab,
  type TabsHighlightItemProps,
  type TabsHighlightProps,
  type TabsListProps,
  type TabsPanelProps,
  type TabsPanelsProps,
  type TabsProps,
  type TabsTabProps,
};
