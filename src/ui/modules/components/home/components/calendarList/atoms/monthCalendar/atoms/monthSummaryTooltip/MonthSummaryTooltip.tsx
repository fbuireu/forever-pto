import { InfoIcon } from 'lucide-react';
import { TooltipProvider } from '@modules/components/core/tooltip/provider/TooltipProvider';
import { Tooltip } from '@modules/components/core/tooltip/Tooltip';
import { TooltipTrigger } from '@modules/components/core/tooltip/atoms/tooltipTrigger/TooltipTrigger';
import { TooltipContent } from '@modules/components/core/tooltip/atoms/tooltipContent/TooltipContent';

export const MonthSummaryTooltip = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Pasa el cursor sobre un día sugerido para ver alternativas similares.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
);