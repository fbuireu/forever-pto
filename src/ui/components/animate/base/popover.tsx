import { cn } from '@ui/lib/utils';
import {
  PopoverBackdrop as PopoverBackdropPrimitive,
  type PopoverBackdropProps as PopoverBackdropPrimitiveProps,
  PopoverClose as PopoverClosePrimitive,
  type PopoverCloseProps as PopoverClosePrimitiveProps,
  PopoverDescription as PopoverDescriptionPrimitive,
  type PopoverDescriptionProps as PopoverDescriptionPrimitiveProps,
  PopoverPopup as PopoverPopupPrimitive,
  type PopoverPopupProps as PopoverPopupPrimitiveProps,
  PopoverPortal as PopoverPortalPrimitive,
  PopoverPositioner as PopoverPositionerPrimitive,
  type PopoverPositionerProps as PopoverPositionerPrimitiveProps,
  Popover as PopoverPrimitive,
  type PopoverProps as PopoverPrimitiveProps,
  PopoverTitle as PopoverTitlePrimitive,
  type PopoverTitleProps as PopoverTitlePrimitiveProps,
  PopoverTrigger as PopoverTriggerPrimitive,
  type PopoverTriggerProps as PopoverTriggerPrimitiveProps,
} from '../primitives/base/popover';

type PopoverProps = PopoverPrimitiveProps;
function Popover(props: PopoverProps) {
  return <PopoverPrimitive {...props} />;
}

type PopoverTriggerProps = PopoverTriggerPrimitiveProps;
function PopoverTrigger(props: PopoverTriggerProps) {
  return <PopoverTriggerPrimitive {...props} />;
}

type PopoverContentProps = PopoverPositionerPrimitiveProps & PopoverPopupPrimitiveProps;
function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  initialFocus,
  finalFocus,
  style,
  children,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPortalPrimitive>
      <PopoverPositionerPrimitive align={align} sideOffset={sideOffset} className='z-50' {...props}>
        <PopoverPopupPrimitive
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          className={cn(
            'bg-popover text-popover-foreground w-72 rounded-[12px] border-[3px] border-[var(--frame)] p-4 shadow-[var(--shadow-brutal-md)] outline-hidden origin-(--transform-origin)',
            className
          )}
          style={style}
        >
          {children}
        </PopoverPopupPrimitive>
      </PopoverPositionerPrimitive>
    </PopoverPortalPrimitive>
  );
}

// Also export as PopoverPanel for new-style usage
const PopoverPanel = PopoverContent;
type PopoverPanelProps = PopoverContentProps;

type PopoverCloseProps = PopoverClosePrimitiveProps;
function PopoverClose(props: PopoverCloseProps) {
  return <PopoverClosePrimitive {...props} />;
}

type PopoverBackdropProps = PopoverBackdropPrimitiveProps;
function PopoverBackdrop(props: PopoverBackdropProps) {
  return <PopoverBackdropPrimitive {...props} />;
}

type PopoverTitleProps = PopoverTitlePrimitiveProps;
function PopoverTitle(props: PopoverTitleProps) {
  return <PopoverTitlePrimitive {...props} />;
}

type PopoverDescriptionProps = PopoverDescriptionPrimitiveProps;
function PopoverDescription(props: PopoverDescriptionProps) {
  return <PopoverDescriptionPrimitive {...props} />;
}

export {
  Popover,
  PopoverBackdrop,
  type PopoverBackdropProps,
  PopoverClose,
  type PopoverCloseProps,
  PopoverContent,
  type PopoverContentProps,
  PopoverDescription,
  type PopoverDescriptionProps,
  PopoverPanel,
  type PopoverPanelProps,
  type PopoverProps,
  PopoverTitle,
  type PopoverTitleProps,
  PopoverTrigger,
  type PopoverTriggerProps,
};
