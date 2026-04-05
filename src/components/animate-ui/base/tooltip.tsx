import * as React from 'react';
import { cn } from '@const/lib/utils';
import {
  TooltipProvider as TooltipProviderPrimitive,
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
  TooltipPositioner as TooltipPositionerPrimitive,
  TooltipPopup as TooltipPopupPrimitive,
  TooltipArrow as TooltipArrowPrimitive,
  TooltipPortal as TooltipPortalPrimitive,
  type TooltipProviderProps as TooltipProviderPrimitiveProps,
  type TooltipProps as TooltipPrimitiveProps,
  type TooltipTriggerProps as TooltipTriggerPrimitiveProps,
  type TooltipPositionerProps as TooltipPositionerPrimitiveProps,
  type TooltipPopupProps as TooltipPopupPrimitiveProps,
} from '../primitives/base/tooltip';

type TooltipProviderProps = TooltipProviderPrimitiveProps & { delayDuration?: number };
function TooltipProvider({ delay = 0, delayDuration, ...props }: TooltipProviderProps) {
  const resolvedDelay = delayDuration !== undefined ? delayDuration : delay;
  return <TooltipProviderPrimitive delay={resolvedDelay} {...props} />;
}

type TooltipProps = TooltipPrimitiveProps & { delay?: number; delayDuration?: number };
function Tooltip({ delay = 0, delayDuration, ...props }: TooltipProps) {
  const resolvedDelay = delayDuration !== undefined ? delayDuration : delay;
  return <TooltipProvider delay={resolvedDelay}><TooltipPrimitive {...props} /></TooltipProvider>;
}

type TooltipTriggerProps = TooltipTriggerPrimitiveProps;
function TooltipTrigger({ ...props }: TooltipTriggerProps) { return <TooltipTriggerPrimitive {...props} />; }

type TooltipContentProps = TooltipPositionerPrimitiveProps & TooltipPopupPrimitiveProps;
function TooltipContent({ className, sideOffset = 4, children, style, ...props }: TooltipContentProps) {
  return (
    <TooltipPortalPrimitive>
      <TooltipPositionerPrimitive sideOffset={sideOffset} className="z-50" {...props}>
        <TooltipPopupPrimitive
          className={cn('bg-primary text-primary-foreground w-fit origin-(--transform-origin) rounded-md px-3 py-1.5 text-xs text-balance', className)}
          style={style}
        >
          {children}
          <TooltipArrowPrimitive className="bg-primary fill-primary z-50 size-2.5 data-[side='bottom']:-top-[4px] data-[side='right']:-left-[4px] data-[side='left']:-right-[4px] data-[side='inline-start']:-right-[4px] data-[side='inline-end']:-left-[4px] rotate-45 rounded-[2px]" />
        </TooltipPopupPrimitive>
      </TooltipPositionerPrimitive>
    </TooltipPortalPrimitive>
  );
}

// Also export as TooltipPanel for new-style usage
const TooltipPanel = TooltipContent;
type TooltipPanelProps = TooltipContentProps;

export {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, TooltipPanel,
  type TooltipProviderProps, type TooltipProps, type TooltipTriggerProps, type TooltipContentProps, type TooltipPanelProps,
};
