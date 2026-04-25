'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { getStrictContext } from '@ui/utils/context';
import { AnimatePresence, type HTMLMotionProps, m } from 'motion/react';
import * as React from 'react';
import { useControlledState } from 'src/ui/hooks/useControlledState';

type DialogContextType = {
  isOpen: boolean;
  setIsOpen: DialogProps['onOpenChange'];
};

const [DialogProvider, useDialog] = getStrictContext<DialogContextType>('DialogContext');

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;

function Dialog(props: DialogProps) {
  const [isOpen, setIsOpen] = useControlledState({
    value: props?.open,
    defaultValue: props?.defaultOpen,
    onChange: props?.onOpenChange,
  });
  return (
    <DialogProvider value={{ isOpen, setIsOpen }}>
      <DialogPrimitive.Root data-slot='dialog' {...props} onOpenChange={setIsOpen} />
    </DialogProvider>
  );
}

type DialogTriggerProps = React.ComponentProps<typeof DialogPrimitive.Trigger> & { asChild?: boolean };
function DialogTrigger({ asChild, children, ...props }: DialogTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return <DialogPrimitive.Trigger data-slot='dialog-trigger' render={children} {...props} />;
  }
  return (
    <DialogPrimitive.Trigger data-slot='dialog-trigger' {...props}>
      {children}
    </DialogPrimitive.Trigger>
  );
}

type DialogPortalProps = Omit<React.ComponentProps<typeof DialogPrimitive.Portal>, 'keepMounted'>;
function DialogPortal(props: DialogPortalProps) {
  const { isOpen } = useDialog();
  return (
    <AnimatePresence>
      {isOpen && <DialogPrimitive.Portal data-slot='dialog-portal' keepMounted {...props} />}
    </AnimatePresence>
  );
}

type DialogBackdropProps = Omit<React.ComponentProps<typeof DialogPrimitive.Backdrop>, 'render'> &
  HTMLMotionProps<'div'>;
function DialogBackdrop({ transition = { duration: 0.2, ease: 'easeInOut' }, ...props }: DialogBackdropProps) {
  return (
    <DialogPrimitive.Backdrop
      data-slot='dialog-backdrop'
      render={
        <m.div
          key='dialog-backdrop'
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={transition}
          {...props}
        />
      }
    />
  );
}

type DialogFlipDirection = 'top' | 'bottom' | 'left' | 'right';
type DialogPopupProps = Omit<React.ComponentProps<typeof DialogPrimitive.Popup>, 'render'> &
  HTMLMotionProps<'div'> & { from?: DialogFlipDirection };

function DialogPopup({
  from = 'top',
  initialFocus,
  finalFocus,
  transition = { duration: 0.2, ease: 'easeInOut' },
  ...props
}: DialogPopupProps) {
  return (
    <DialogPrimitive.Popup
      initialFocus={initialFocus}
      finalFocus={finalFocus}
      render={
        <m.div
          key='dialog-popup'
          data-slot='dialog-popup'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={transition}
          {...props}
        />
      }
    />
  );
}

type DialogCloseProps = React.ComponentProps<typeof DialogPrimitive.Close>;
function DialogClose(props: DialogCloseProps) {
  return <DialogPrimitive.Close data-slot='dialog-close' {...props} />;
}

type DialogHeaderProps = React.ComponentProps<'div'>;
function DialogHeader(props: DialogHeaderProps) {
  return <div data-slot='dialog-header' {...props} />;
}

type DialogFooterProps = React.ComponentProps<'div'>;
function DialogFooter(props: DialogFooterProps) {
  return <div data-slot='dialog-footer' {...props} />;
}

type DialogTitleProps = React.ComponentProps<typeof DialogPrimitive.Title>;
function DialogTitle(props: DialogTitleProps) {
  return <DialogPrimitive.Title data-slot='dialog-title' {...props} />;
}

type DialogDescriptionProps = React.ComponentProps<typeof DialogPrimitive.Description>;
function DialogDescription(props: DialogDescriptionProps) {
  return <DialogPrimitive.Description data-slot='dialog-description' {...props} />;
}

export {
  Dialog,
  DialogBackdrop,
  type DialogBackdropProps,
  DialogClose,
  type DialogCloseProps,
  type DialogContextType,
  DialogDescription,
  type DialogDescriptionProps,
  type DialogFlipDirection,
  DialogFooter,
  type DialogFooterProps,
  DialogHeader,
  type DialogHeaderProps,
  DialogPopup,
  type DialogPopupProps,
  DialogPortal,
  type DialogPortalProps,
  type DialogProps,
  DialogTitle,
  type DialogTitleProps,
  DialogTrigger,
  type DialogTriggerProps,
  useDialog,
};
