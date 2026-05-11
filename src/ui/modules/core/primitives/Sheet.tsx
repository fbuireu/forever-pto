'use client';

import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { cn } from '@ui/utils/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { X } from '../animate/icons/X';

function Sheet(props: Readonly<SheetPrimitive.Root.Props>) {
  return <SheetPrimitive.Root data-slot='sheet' {...props} />;
}

function SheetTrigger(props: Readonly<SheetPrimitive.Trigger.Props>) {
  return <SheetPrimitive.Trigger data-slot='sheet-trigger' {...props} />;
}

function SheetClose(props: Readonly<SheetPrimitive.Close.Props>) {
  return <SheetPrimitive.Close data-slot='sheet-close' {...props} />;
}

function SheetPortal(props: Readonly<SheetPrimitive.Portal.Props>) {
  return <SheetPrimitive.Portal data-slot='sheet-portal' {...props} />;
}

type SheetOverlayProps = SheetPrimitive.Backdrop.Props;

function SheetOverlay({ className, ...props }: Readonly<SheetOverlayProps>) {
  return (
    <SheetPrimitive.Backdrop
      data-slot='sheet-overlay'
      className={cn(
        'fixed inset-0 z-[51] bg-black/80 transition-[opacity,filter] duration-200 ease-in-out',
        'data-starting-style:opacity-0 data-starting-style:[filter:blur(4px)]',
        'data-ending-style:opacity-0 data-ending-style:[filter:blur(4px)]',
        className
      )}
      {...props}
    />
  );
}

const sheetVariants = cva(
  'fixed z-[51] flex flex-col gap-4 bg-card p-6 border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-xl)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  {
    variants: {
      side: {
        top: [
          'inset-x-0 top-0 rounded-b-[14px]',
          'data-starting-style:-translate-y-full data-starting-style:opacity-0',
          'data-ending-style:-translate-y-full data-ending-style:opacity-0',
        ],
        bottom: [
          'inset-x-0 bottom-0 rounded-t-[14px]',
          'data-starting-style:translate-y-full data-starting-style:opacity-0',
          'data-ending-style:translate-y-full data-ending-style:opacity-0',
        ],
        left: [
          'inset-y-0 left-0 h-full w-3/4 rounded-r-[14px] sm:max-w-sm',
          'data-starting-style:-translate-x-full data-starting-style:opacity-0',
          'data-ending-style:-translate-x-full data-ending-style:opacity-0',
        ],
        right: [
          'inset-y-0 right-0 h-full w-3/4 rounded-l-[14px] sm:max-w-sm',
          'data-starting-style:translate-x-full data-starting-style:opacity-0',
          'data-ending-style:translate-x-full data-ending-style:opacity-0',
        ],
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

type SheetContentProps = SheetPrimitive.Popup.Props &
  VariantProps<typeof sheetVariants> & {
    showCloseButton?: boolean;
  };

function SheetContent({
  side = 'right',
  className,
  children,
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot='sheet-content'
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot='sheet-close'
            className='absolute right-4 top-4 z-10 cursor-pointer rounded-[8px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel)] p-1.5 shadow-[var(--shadow-brutal-xs)] transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] focus:outline-none focus:ring-[3px] focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none'
          >
            <X className='h-4 w-4' />
            <span className='sr-only'>Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

type SheetHeaderProps = React.ComponentProps<'div'>;

function SheetHeader({ className, ...props }: SheetHeaderProps) {
  return (
    <div
      data-slot='sheet-header'
      className={cn('flex flex-col gap-3 border-b-[2px] border-[var(--frame)]/18 pb-4 text-center sm:text-left', className)}
      {...props}
    />
  );
}

type SheetFooterProps = React.ComponentProps<'div'>;

function SheetFooter({ className, ...props }: SheetFooterProps) {
  return (
    <div
      data-slot='sheet-footer'
      className={cn('mt-auto flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}

type SheetTitleProps = SheetPrimitive.Title.Props;

function SheetTitle({ className, ...props }: Readonly<SheetTitleProps>) {
  return (
    <SheetPrimitive.Title
      data-slot='sheet-title'
      className={cn('text-xl leading-none font-black tracking-[-0.03em]', className)}
      {...props}
    />
  );
}

type SheetDescriptionProps = SheetPrimitive.Description.Props;

function SheetDescription({ className, ...props }: Readonly<SheetDescriptionProps>) {
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
  type SheetContentProps,
  SheetContent,
  type SheetDescriptionProps,
  SheetDescription,
  type SheetFooterProps,
  SheetFooter,
  type SheetHeaderProps,
  SheetHeader,
  type SheetOverlayProps,
  SheetOverlay,
  type SheetPortalProps,
  SheetPortal,
  type SheetContentProps as SheetProps,
  type SheetTitleProps,
  SheetTitle,
  SheetTrigger,
};
