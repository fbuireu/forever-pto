import { cn } from '@ui/utils/cn';
import {
  TooltipArrow as TooltipArrowPrimitive,
  TooltipPopup as TooltipPopupPrimitive,
  type TooltipPopupProps as TooltipPopupPrimitiveProps,
  TooltipPortal as TooltipPortalPrimitive,
  TooltipPositioner as TooltipPositionerPrimitive,
  type TooltipPositionerProps as TooltipPositionerPrimitiveProps,
  Tooltip as TooltipPrimitive,
  type TooltipProps as TooltipPrimitiveProps,
  TooltipProvider as TooltipProviderPrimitive,
  type TooltipProviderProps as TooltipProviderPrimitiveProps,
  TooltipTrigger as TooltipTriggerPrimitive,
  type TooltipTriggerProps as TooltipTriggerPrimitiveProps,
} from '../primitives/base/Tooltip';

type TooltipProviderProps = TooltipProviderPrimitiveProps & { delayDuration?: number };
function TooltipProvider({ delay = 0, delayDuration, ...props }: TooltipProviderProps) {
  const resolvedDelay = delayDuration ?? delay;
  return <TooltipProviderPrimitive delay={resolvedDelay} {...props} />;
}

type TooltipProps = TooltipPrimitiveProps & { delay?: number; delayDuration?: number };
function Tooltip({ delay = 0, delayDuration, ...props }: TooltipProps) {
  const resolvedDelay = delayDuration ?? delay;
  return (
    <TooltipProvider delay={resolvedDelay}>
      <TooltipPrimitive {...props} />
    </TooltipProvider>
  );
}

type TooltipTriggerProps = TooltipTriggerPrimitiveProps;
function TooltipTrigger({ ...props }: TooltipTriggerProps) {
  return <TooltipTriggerPrimitive {...props} />;
}

type TooltipContentProps = TooltipPositionerPrimitiveProps & TooltipPopupPrimitiveProps;
function TooltipContent({ className, sideOffset = 4, children, style, ...props }: TooltipContentProps) {
  return (
    <TooltipPortalPrimitive>
      <TooltipPositionerPrimitive sideOffset={sideOffset} className='z-50' {...props}>
        <TooltipPopupPrimitive
          className={cn(
            'bg-primary text-primary-foreground w-fit origin-(--transform-origin) rounded-[8px] border-[3px] border-(--frame) px-3 py-2 text-xs font-bold text-balance shadow-(--shadow-brutal-3-accent)',
            className
          )}
          style={style}
        >
          {children}
          <TooltipArrowPrimitive className="bg-primary fill-primary z-50 size-2.5 border-[3px] border-(--frame) data-[side='bottom']:-top-1 data-[side='right']:-left-1 data-[side='left']:-right-1 data-[side='inline-start']:-right-1 data-[side='inline-end']:-left-1 rotate-45 rounded-xs" />
        </TooltipPopupPrimitive>
      </TooltipPositionerPrimitive>
    </TooltipPortalPrimitive>
  );
}

type TooltipInfoTriggerProps = Omit<TooltipTriggerProps, 'children'> & { className?: string };
function TooltipInfoTrigger({ className, ...props }: TooltipInfoTriggerProps) {
  return (
    <TooltipTriggerPrimitive
      className={cn(
        'ml-auto cursor-help shrink-0 size-5 grid place-items-center rounded-[5px] border-2 border-(--frame) bg-accent text-(--color-brand-ink) shadow-(--shadow-brutal-xs) hover:-translate-x-px hover:-translate-y-px hover:shadow-(--shadow-brutal-3) active:translate-x-px active:translate-y-px active:shadow-(--shadow-brutal-btn-active) transition-[transform,box-shadow] duration-75',
        className
      )}
      {...props}
    >
      <span className='text-[11px] font-black font-mono leading-none' aria-hidden='true'>
        i
      </span>
    </TooltipTriggerPrimitive>
  );
}

export { Tooltip, TooltipContent, TooltipInfoTrigger, TooltipProvider, TooltipTrigger };
