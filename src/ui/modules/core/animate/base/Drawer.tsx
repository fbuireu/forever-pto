'use client';

import { cn } from '@ui/utils/utils';
import { Drawer as DrawerPrimitive } from 'vaul';

function Drawer({ shouldScaleBackground = false, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} data-slot='drawer' {...props} />;
}

function DrawerTrigger({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot='drawer-trigger' className={cn('cursor-pointer', className)} {...props} />;
}

function DrawerPortal(props: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot='drawer-portal' {...props} />;
}

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot='drawer-close' {...props} />;
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
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
}: React.ComponentProps<typeof DrawerPrimitive.Content> & { overlay?: boolean }) {
  return (
    <DrawerPortal>
      {overlay && <DrawerOverlay />}
      <DrawerPrimitive.Content
        data-slot='drawer-content'
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[14px] border-t-[3px] border-x-[3px] border-[var(--frame)] bg-card focus:outline-none max-h-[85dvh]',
          className
        )}
        {...props}
      >
        <DrawerPrimitive.Handle className='mx-auto mt-4 mb-1 h-1.5 w-20 rounded-full bg-[var(--frame)]/30' />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

export { Drawer, DrawerClose, DrawerContent, DrawerOverlay, DrawerPortal, DrawerTrigger };
