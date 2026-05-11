'use client';

import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { cn } from '@ui/utils/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { type HTMLMotionProps, m, type Transition } from 'motion/react';
import * as React from 'react';
import { createContext, use, useCallback, useState } from 'react';
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
  const [localIsOpen, setLocalIsOpen] = useState(props?.defaultOpen ?? false);
  // Derive isOpen synchronously so SheetContent portal renders in the same cycle
  // that base-ui receives open=true — prevents base-ui state corruption on re-open.
  const isOpen = props?.open ?? localIsOpen;

  const handleOpenChange = useCallback(
    (...args: Parameters<NonNullable<SheetProps['onOpenChange']>>) => {
      setLocalIsOpen(args[0]);
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
      className={cn('fixed inset-0 z-[51] bg-black/80', className)}
      {...props}
    />
  );
}

const sheetVariants = cva(
  'fixed z-[51] gap-4 bg-card p-6 border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-xl)]',
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

  const closedPosition =
    side === 'right'
      ? { x: '100%', opacity: 0 }
      : side === 'left'
        ? { x: '-100%', opacity: 0 }
        : side === 'top'
          ? { y: '-100%', opacity: 0 }
          : { y: '100%', opacity: 0 };

  const { style: propsStyle, ...restProps } = props as HTMLMotionProps<'div'>;

  return (
    // Portal always rendered — base-ui controls Popup lifecycle via keepMounted.
    // AnimatePresence is intentionally absent: it fights base-ui's own cleanup,
    // leaving the touch-none overlay in the DOM and freezing the UI on mobile.
    <SheetPortal data-slot='sheet-portal'>
      {/* Overlay: always in the DOM, animated via CSS transitions.
          SheetPrimitive.Backdrop has no keepMounted, so base-ui unmounts it
          on close — preventing any exit animation. A plain div driven by
          isOpen avoids that while keeping touchAction safe. */}
      {overlay && (
        <div
          data-slot='sheet-overlay'
          className='fixed inset-0 z-[51] bg-black/80 transition-[opacity,filter] duration-200 ease-in-out'
          style={{
            opacity: isOpen ? 1 : 0,
            filter: isOpen ? 'blur(0px)' : 'blur(4px)',
            pointerEvents: isOpen ? 'auto' : 'none',
            touchAction: isOpen ? 'none' : 'auto',
          }}
        />
      )}
      {/* Popup: keepMounted keeps it in the DOM so motion can animate the
          exit (slide off-screen). pointerEvents:none when closed prevents
          the off-screen panel from capturing touch events. */}
      <SheetPrimitive.Popup
        keepMounted
        render={
          <m.div
            key='sheet-content'
            data-slot='sheet-content'
            animate={isOpen ? { x: 0, y: 0, opacity: 1 } : closedPosition}
            initial={closedPosition}
            transition={transition}
            style={{
              display: 'flex',
              flexDirection: 'column',
              ...propsStyle,
              pointerEvents: isOpen ? 'auto' : 'none',
            }}
            className={cn(sheetVariants({ side }), className)}
            {...restProps}
          />
        }
      >
        {children}
        <SheetPrimitive.Close
          data-slot='sheet-close'
          className='absolute right-4 top-4 z-10 cursor-pointer rounded-[8px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel)] p-1.5 shadow-[var(--shadow-brutal-xs)] transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] focus:outline-none focus:ring-[3px] focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none'
        >
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPortal>
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
