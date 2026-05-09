'use client';

import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { cn } from '@ui/utils/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, type HTMLMotionProps, m, type Transition } from 'motion/react';
import * as React from 'react';
import { createContext, use, useCallback, useEffect, useState } from 'react';
import { AnimateIcon } from '../icons/Icon';
import { X } from '../icons/X';

type SheetContextType = {
  isOpen: boolean;
};

const SheetContext = createContext<SheetContextType | undefined>(undefined);

const useSheet = (): SheetContextType => {
  const context = use(SheetContext);
  if (!context) {
    throw new Error('useSheet must be used within a Sheet');
  }
  return context;
};

type SheetProps = React.ComponentProps<typeof SheetPrimitive.Root>;

function Sheet({ children, ...props }: SheetProps) {
  const [isOpen, setIsOpen] = useState(props?.open ?? props?.defaultOpen ?? false);

  useEffect(() => {
    if (props?.open !== undefined) setIsOpen(props.open);
  }, [props?.open]);

  const handleOpenChange = useCallback(
    (...args: Parameters<NonNullable<SheetProps['onOpenChange']>>) => {
      setIsOpen(args[0]);
      props.onOpenChange?.(...args);
    },
    [props.onOpenChange]
  );

  return (
    <SheetContext.Provider value={{ isOpen }}>
      <SheetPrimitive.Root data-slot='sheet' {...props} onOpenChange={handleOpenChange}>
        {children}
      </SheetPrimitive.Root>
    </SheetContext.Provider>
  );
}

type SheetTriggerProps = React.ComponentProps<typeof SheetPrimitive.Trigger> & { asChild?: boolean };

function SheetTrigger({ asChild, children, ...props }: SheetTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return <SheetPrimitive.Trigger data-slot='sheet-trigger' render={children as React.ReactElement} {...props} />;
  }
  return (
    <SheetPrimitive.Trigger data-slot='sheet-trigger' {...props}>
      {children}
    </SheetPrimitive.Trigger>
  );
}

type SheetCloseProps = React.ComponentProps<typeof SheetPrimitive.Close>;

function SheetClose(props: SheetCloseProps) {
  return <SheetPrimitive.Close data-slot='sheet-close' {...props} />;
}

type SheetPortalProps = React.ComponentProps<typeof SheetPrimitive.Portal>;

function SheetPortal(props: SheetPortalProps) {
  return <SheetPrimitive.Portal data-slot='sheet-portal' {...props} />;
}

type SheetOverlayProps = React.ComponentProps<typeof SheetPrimitive.Backdrop>;

function SheetOverlay({ className, ...props }: SheetOverlayProps) {
  return (
    <SheetPrimitive.Backdrop
      data-slot='sheet-overlay'
      className={cn('fixed inset-0 z-50 bg-black/80', className)}
      {...props}
    />
  );
}

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-card p-6 border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-xl)]',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 rounded-b-[14px]',
        bottom: 'inset-x-0 bottom-0 rounded-t-[14px]',
        left: 'inset-y-0 left-0 h-full w-3/4 rounded-r-[14px] sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-3/4 rounded-l-[14px] sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

type SheetContentProps = Omit<React.ComponentProps<typeof SheetPrimitive.Popup>, 'render'> &
  VariantProps<typeof sheetVariants> &
  HTMLMotionProps<'div'> & {
    transition?: Transition;
    overlay?: boolean;
  };

function SheetContent({
  side = 'right',
  className,
  transition = { type: 'spring', stiffness: 150, damping: 25 },
  overlay = true,
  children,
  ...props
}: SheetContentProps) {
  const { isOpen } = useSheet();

  return (
    <AnimatePresence>
      {isOpen && (
        <SheetPortal keepMounted data-slot='sheet-portal'>
          {overlay && (
            <SheetPrimitive.Backdrop
              data-slot='sheet-overlay'
              render={
                <m.div
                  key='sheet-overlay'
                  data-slot='sheet-overlay'
                  className='fixed inset-0 z-50 bg-black/80'
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                />
              }
            />
          )}
          <SheetPrimitive.Popup
            render={
              <m.div
                key='sheet-content'
                data-slot='sheet-content'
                initial={
                  side === 'right'
                    ? { x: '100%', opacity: 0 }
                    : side === 'left'
                      ? { x: '-100%', opacity: 0 }
                      : side === 'top'
                        ? { y: '-100%', opacity: 0 }
                        : { y: '100%', opacity: 0 }
                }
                animate={{ x: 0, y: 0, opacity: 1 }}
                exit={
                  side === 'right'
                    ? { x: '100%', opacity: 0 }
                    : side === 'left'
                      ? { x: '-100%', opacity: 0 }
                      : side === 'top'
                        ? { y: '-100%', opacity: 0 }
                        : { y: '100%', opacity: 0 }
                }
                transition={transition}
                className={cn(sheetVariants({ side }), className)}
                {...(props as HTMLMotionProps<'div'>)}
              />
            }
          >
            {children}
            <AnimateIcon animateOnHover>
              <SheetPrimitive.Close
                data-slot='sheet-close'
                className='absolute right-4 top-4 cursor-pointer rounded-[8px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel)] p-1.5 shadow-[var(--shadow-brutal-xs)] transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] focus:outline-none focus:ring-[3px] focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none'
              >
                <X className='h-4 w-4' animateOnHover />
                <span className='sr-only'>Close</span>
              </SheetPrimitive.Close>
            </AnimateIcon>
          </SheetPrimitive.Popup>
        </SheetPortal>
      )}
    </AnimatePresence>
  );
}

type SheetHeaderProps = React.ComponentProps<'div'>;

function SheetHeader({ className, ...props }: SheetHeaderProps) {
  return (
    <div
      data-slot='sheet-header'
      className={cn(
        'flex flex-col gap-3 border-b-[2px] border-[var(--frame)]/18 pb-4 text-center sm:text-left',
        className
      )}
      {...props}
    />
  );
}

type SheetFooterProps = React.ComponentProps<'div'>;

function SheetFooter({ className, ...props }: SheetFooterProps) {
  return (
    <div
      data-slot='sheet-footer'
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}

type SheetTitleProps = React.ComponentProps<typeof SheetPrimitive.Title>;

function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <SheetPrimitive.Title
      data-slot='sheet-title'
      className={cn('text-xl leading-none font-black tracking-[-0.03em]', className)}
      {...props}
    />
  );
}

type SheetDescriptionProps = React.ComponentProps<typeof SheetPrimitive.Description>;

function SheetDescription({ className, ...props }: SheetDescriptionProps) {
  return (
    <SheetPrimitive.Description
      data-slot='sheet-description'
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  type SheetCloseProps,
  SheetContent,
  type SheetContentProps,
  SheetDescription,
  type SheetDescriptionProps,
  SheetFooter,
  type SheetFooterProps,
  SheetHeader,
  type SheetHeaderProps,
  SheetOverlay,
  type SheetOverlayProps,
  SheetPortal,
  type SheetPortalProps,
  type SheetProps,
  SheetTitle,
  type SheetTitleProps,
  SheetTrigger,
  type SheetTriggerProps,
  useSheet,
};
