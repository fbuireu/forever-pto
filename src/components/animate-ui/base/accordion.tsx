'use client';

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { cn } from '@const/lib/utils';
import { AnimatePresence, motion, type HTMLMotionProps, type Transition } from 'motion/react';
import { createContext, use, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ChevronDown } from '../icons/chevron-down';
import { AnimateIcon } from '../icons/icon';

type AccordionItemContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const AccordionItemContext = createContext<AccordionItemContextType | undefined>(undefined);

// ✨ USO DE use() PARA CONTEXT - React 19
const useAccordionItem = (): AccordionItemContextType => {
  const context = use(AccordionItemContext);
  if (!context) {
    throw new Error('useAccordionItem must be used within an AccordionItem');
  }
  return context;
};

type AccordionProps = React.ComponentProps<typeof AccordionPrimitive.Root>;

function Accordion(props: AccordionProps) {
  return <AccordionPrimitive.Root data-slot='accordion' {...props} />;
}

type AccordionItemProps = React.ComponentProps<typeof AccordionPrimitive.Item> & {
  children: React.ReactNode;
};

function AccordionItem({ className, children, ...props }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Memoizar el valor del contexto
  const contextValue = useMemo(() => ({ isOpen, setIsOpen }), [isOpen]);

  return (
    <AccordionItemContext.Provider value={contextValue}>
      <AccordionPrimitive.Item data-slot='accordion-item' className={cn('border-b', className)} {...props}>
        {children}
      </AccordionPrimitive.Item>
    </AccordionItemContext.Provider>
  );
}

type AccordionTriggerProps = React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  transition?: Transition;
  chevron?: boolean;
};

function AccordionTrigger({
  ref,
  className,
  children,
  transition = { type: 'spring', stiffness: 150, damping: 22 },
  chevron = true,
  ...props
}: AccordionTriggerProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);
  const { isOpen, setIsOpen } = useAccordionItem();

  useEffect(() => {
    const node = triggerRef.current;
    if (!node) return;
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.attributeName === 'data-panel-open') {
          const currentState = node.getAttribute('data-panel-open');
          setIsOpen(currentState === '');
        }
      });
    });
    observer.observe(node, {
      attributes: true,
      attributeFilter: ['data-panel-open'],
    });
    const initialState = node.getAttribute('data-panel-open');
    setIsOpen(initialState === '');
    return () => observer.disconnect();
  }, [setIsOpen]);

  return (
    <AccordionPrimitive.Header data-slot='accordion-header' className='flex'>
      <AnimateIcon animateOnHover>
        <AccordionPrimitive.Trigger
          ref={triggerRef}
          data-slot='accordion-trigger'
          className={cn(
            'flex flex-1 text-start items-center justify-between py-4 font-medium hover:underline cursor-pointer',
            className
          )}
          {...props}
        >
          {children}

          {chevron && (
            <motion.div
              data-slot='accordion-trigger-chevron'
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={transition}
            >
              <ChevronDown className='size-5 shrink-0' />
            </motion.div>
          )}
        </AccordionPrimitive.Trigger>
      </AnimateIcon>
    </AccordionPrimitive.Header>
  );
}

type AccordionPanelProps = React.ComponentProps<typeof AccordionPrimitive.Panel> & {
  motionProps?: HTMLMotionProps<'div'>;
  transition?: Transition;
};

function AccordionPanel({
  className,
  children,
  transition = { type: 'spring', stiffness: 150, damping: 22 },
  motionProps,
  ...props
}: AccordionPanelProps) {
  const { isOpen } = useAccordionItem();

  return (
    <AnimatePresence>
      {isOpen && (
        <AccordionPrimitive.Panel
          hidden={false}
          keepMounted
          render={
            <motion.div
              key='accordion-panel'
              data-slot='accordion-panel'
              initial={{ height: 0, opacity: 0, '--mask-stop': '0%' }}
              animate={{ height: 'auto', opacity: 1, '--mask-stop': '100%' }}
              exit={{ height: 0, opacity: 0, '--mask-stop': '0%' }}
              transition={transition}
              style={{
                maskImage: 'linear-gradient(black var(--mask-stop), transparent var(--mask-stop))',
                WebkitMaskImage: 'linear-gradient(black var(--mask-stop), transparent var(--mask-stop))',
              }}
              className='overflow-hidden'
              {...motionProps}
            >
              <div className={cn('pb-4 pt-0 text-sm', className)}>{children}</div>
            </motion.div>
          }
          {...props}
        />
      )}
    </AnimatePresence>
  );
}

export {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  useAccordionItem,
  type AccordionItemContextType,
  type AccordionItemProps,
  type AccordionPanelProps,
  type AccordionProps,
  type AccordionTriggerProps,
};
