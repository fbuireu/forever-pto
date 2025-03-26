import { InfoIcon } from 'lucide-react';
import { memo } from 'react';
import { Tooltip } from '@modules/components/core/tooltip/Tooltip';
import { TooltipTrigger } from '@modules/components/core/tooltip/atoms/tooltipTrigger/TooltipTrigger';
import { TooltipContent } from '@modules/components/core/tooltip/atoms/tooltipContent/TooltipContent';
import { TooltipProvider } from '@modules/components/core/tooltip/provider/TooltipProvider';

export const CarryOverMonthsTooltip = memo(() => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>Permite añadir meses de carryover al siguiente año</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
));
