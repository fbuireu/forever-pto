import { cn } from '@ui/lib/utils';
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
} from '../primitives/base/tooltip';

type TooltipProviderProps = TooltipProviderPrimitiveProps & { delayDuration?: number };
function TooltipProvider({ delay = 0, delayDuration, ...props }: TooltipProviderProps) {
  const resolvedDelay = delayDuration !== undefined ? delayDuration : delay;
  return <TooltipProviderPrimitive delay={resolvedDelay} {...props} />;
}

type TooltipProps = TooltipPrimitiveProps & { delay?: number; delayDuration?: number };
function Tooltip({ delay = 0, delayDuration, ...props }: TooltipProps) {
  const resolvedDelay = delayDuration !== undefined ? delayDuration : delay;
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
            'bg-primary text-primary-foreground w-fit origin-(--transform-origin) rounded-[8px] border-[3px] border-[var(--frame)] px-3 py-2 text-xs font-bold text-balance shadow-[3px_3px_0_0_var(--accent)]',
            className
          )}
          style={style}
        >
          {children}
          <TooltipArrowPrimitive className="bg-primary fill-primary z-50 size-2.5 border-[3px] border-[var(--frame)] data-[side='bottom']:-top-[4px] data-[side='right']:-left-[4px] data-[side='left']:-right-[4px] data-[side='inline-start']:-right-[4px] data-[side='inline-end']:-left-[4px] rotate-45 rounded-[2px]" />
        </TooltipPopupPrimitive>
      </TooltipPositionerPrimitive>
    </TooltipPortalPrimitive>
  );
}

// Also export as TooltipPanel for new-style usage
const TooltipPanel = TooltipContent;
type TooltipPanelProps = TooltipContentProps;

export {
  Tooltip,
  TooltipContent,
  type TooltipContentProps,
  TooltipPanel,
  type TooltipPanelProps,
  type TooltipProps,
  TooltipProvider,
  type TooltipProviderProps,
  TooltipTrigger,
  type TooltipTriggerProps,
};
