import { cn } from '@ui/utils/utils';
import { XIcon } from 'lucide-react';
import {
  DialogBackdrop as DialogBackdropPrimitive,
  type DialogBackdropProps as DialogBackdropPrimitiveProps,
  DialogClose as DialogClosePrimitive,
  type DialogCloseProps as DialogClosePrimitiveProps,
  DialogDescription as DialogDescriptionPrimitive,
  type DialogDescriptionProps as DialogDescriptionPrimitiveProps,
  DialogFooter as DialogFooterPrimitive,
  type DialogFooterProps as DialogFooterPrimitiveProps,
  DialogHeader as DialogHeaderPrimitive,
  type DialogHeaderProps as DialogHeaderPrimitiveProps,
  DialogPopup as DialogPopupPrimitive,
  type DialogPopupProps as DialogPopupPrimitiveProps,
  DialogPortal as DialogPortalPrimitive,
  Dialog as DialogPrimitive,
  type DialogProps as DialogPrimitiveProps,
  DialogTitle as DialogTitlePrimitive,
  type DialogTitleProps as DialogTitlePrimitiveProps,
  DialogTrigger as DialogTriggerPrimitive,
  type DialogTriggerProps as DialogTriggerPrimitiveProps,
} from '../primitives/base/Dialog';

type DialogProps = DialogPrimitiveProps;
function Dialog(props: DialogProps) {
  return <DialogPrimitive {...props} />;
}

type DialogTriggerProps = DialogTriggerPrimitiveProps;
function DialogTrigger(props: DialogTriggerProps) {
  return <DialogTriggerPrimitive {...props} />;
}

type DialogCloseProps = DialogClosePrimitiveProps;
function DialogClose(props: DialogCloseProps) {
  return <DialogClosePrimitive {...props} />;
}

type DialogBackdropProps = DialogBackdropPrimitiveProps;
function DialogBackdrop({ className, ...props }: DialogBackdropProps) {
  return (
    <DialogBackdropPrimitive
      className={cn(
        'fixed inset-0 z-50 bg-[linear-gradient(180deg,rgba(20,17,15,0.66),rgba(20,17,15,0.82))] backdrop-blur-[2px]',
        className
      )}
      {...props}
    />
  );
}

type DialogPopupProps = DialogPopupPrimitiveProps & { showCloseButton?: boolean };
function DialogPopup({ className, children, showCloseButton = true, ...props }: DialogPopupProps) {
  return (
    <DialogPortalPrimitive>
      <DialogBackdrop />
      <DialogPopupPrimitive
        className={cn(
          'bg-card fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-[14px] border-[3px] border-[var(--frame)] p-6 shadow-[var(--shadow-brutal-xl)] sm:max-w-lg',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClosePrimitive className="ring-offset-background focus:ring-ring absolute top-4 right-4 cursor-pointer rounded-[8px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel)] p-1.5 opacity-100 shadow-[var(--shadow-brutal-xs)] transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] focus:ring-[3px] focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <XIcon />
            <span className='sr-only'>Close</span>
          </DialogClosePrimitive>
        )}
      </DialogPopupPrimitive>
    </DialogPortalPrimitive>
  );
}

// Alias for backward compatibility with shadcn consumers
const DialogContent = DialogPopup;
type DialogContentProps = DialogPopupProps;

type DialogHeaderProps = DialogHeaderPrimitiveProps;
function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <DialogHeaderPrimitive
      className={cn(
        'flex flex-col gap-3 border-b-[2px] border-[var(--frame)]/18 pb-4 text-center sm:text-left',
        className
      )}
      {...props}
    />
  );
}

type DialogFooterProps = DialogFooterPrimitiveProps;
function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <DialogFooterPrimitive
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

type DialogTitleProps = DialogTitlePrimitiveProps;
function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <DialogTitlePrimitive className={cn('text-xl leading-none font-black tracking-[-0.03em]', className)} {...props} />
  );
}

type DialogDescriptionProps = DialogDescriptionPrimitiveProps;
function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <DialogDescriptionPrimitive className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

export {
  Dialog,
  DialogBackdrop,
  DialogClose,
  type DialogCloseProps,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  type DialogDescriptionProps,
  DialogFooter,
  type DialogFooterProps,
  DialogHeader,
  type DialogHeaderProps,
  DialogPopup,
  type DialogPopupProps,
  type DialogProps,
  DialogTitle,
  type DialogTitleProps,
  DialogTrigger,
  type DialogTriggerProps,
};
