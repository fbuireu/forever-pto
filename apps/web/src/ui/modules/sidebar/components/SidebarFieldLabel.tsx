import { Tooltip, TooltipContent, TooltipInfoTrigger, TooltipProvider } from '@ui/modules/core/animate/base/Tooltip';
import { cn } from '@ui/utils/cn';
import type { ReactNode } from 'react';

interface SidebarFieldTooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export const SidebarFieldTooltip = ({ label, children, className }: SidebarFieldTooltipProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipInfoTrigger aria-label={label} />
      <TooltipContent className={cn('w-50 text-pretty', className)}>{children}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface SidebarFieldLabelProps {
  controlId?: string;
  icon: ReactNode;
  title: string;
  tooltip?: { label: string; content: ReactNode; className?: string };
  className?: string;
}

export const SidebarFieldLabel = ({ controlId, icon, title, tooltip, className }: SidebarFieldLabelProps) => {
  const classes = cn('flex gap-2 my-2 text-sm font-mono font-normal', className);
  const body = (
    <>
      {icon} {title}
      {tooltip && (
        <SidebarFieldTooltip label={tooltip.label} className={tooltip.className}>
          {tooltip.content}
        </SidebarFieldTooltip>
      )}
    </>
  );

  if (!controlId) return <div className={classes}>{body}</div>;

  return (
    <label className={classes} htmlFor={controlId}>
      {body}
    </label>
  );
};
