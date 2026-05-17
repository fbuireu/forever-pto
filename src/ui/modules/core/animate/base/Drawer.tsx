'use client';

import type { ComponentProps } from 'react';
import { cn } from '@ui/utils/cn';
import { Drawer as DrawerPrimitive } from 'vaul';

function Drawer({ shouldScaleBackground = false, ...props }: ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} data-slot='drawer' {...props} />;
}

function DrawerPortal(props: ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot='drawer-portal' {...props} />;
}

function DrawerOverlay({ className, ...props }: ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot='drawer-overlay'
      className={cn('fixed inset-0 z-50 bg-black/50', className)}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  overlay = true,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Content> & { overlay?: boolean }) {
  return (
    <DrawerPortal>
      {overlay && <DrawerOverlay />}
      <DrawerPrimitive.Content
        data-slot='drawer-content'
        className={cn(
          'fixed inset-x-0 bottom-0 z-51 flex flex-col rounded-t-[14px] border-t-[3px] border-x-[3px] border-(--frame) bg-card focus:outline-none max-h-[85dvh] shadow-[0_-3px_16px_0_rgba(0,0,0,0.12)]',
          className
        )}
        {...props}
      >
        <DrawerPrimitive.Handle className='mx-auto mt-4 mb-1 h-1.5 w-20 rounded-full bg-(--frame)/30' />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerTitle({ className, ...props }: ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title data-slot='drawer-title' className={cn('sr-only', className)} {...props} />;
}

export { Drawer, DrawerContent, DrawerTitle };
