import { InfoIcon } from 'lucide-react';
import { memo } from 'react';
import { Tooltip } from '@modules/components/core/tooltip/Tooltip';
import { TooltipTrigger } from '@modules/components/core/tooltip/atoms/tooltipTrigger/TooltipTrigger';
import { TooltipContent } from '@modules/components/core/tooltip/atoms/tooltipContent/TooltipContent';
import { TooltipProvider } from '@modules/components/core/tooltip/provider/TooltipProvider';

export const AllowPasDaysInfoTooltip = memo(() => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="w-2xs">
          <p>
            Este switch permite habilitar o deshabilitar la sugerencia de días festivos pasados para ver las
            oportunidades
            perdidas.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
));
