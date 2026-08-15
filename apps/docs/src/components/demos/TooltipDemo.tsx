import { Tooltip, TooltipContent, TooltipInfoTrigger, TooltipTrigger } from '@ui/modules/core/animate/base/Tooltip';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Button } from '@ui/modules/core/primitives/Button';
import { Demo } from '../Demo';

export const TooltipDemo = () => (
  <Demo>
    <LazyMotionProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='outline'>Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>Springs in from scale 0.5 with a rotated square arrow.</TooltipContent>
      </Tooltip>
      <Tooltip delay={500}>
        <TooltipTrigger asChild>
          <Button variant='secondary'>Delayed (500ms)</Button>
        </TooltipTrigger>
        <TooltipContent>This one waits half a second before opening.</TooltipContent>
      </Tooltip>
    </LazyMotionProvider>
  </Demo>
);

export const TooltipInfoTriggerDemo = () => (
  <Demo>
    <LazyMotionProvider>
      <div className='flex items-center gap-2 text-sm font-semibold'>
        Efficiency score
        <Tooltip>
          <TooltipInfoTrigger className='ml-0' />
          <TooltipContent>Days off gained per PTO day spent.</TooltipContent>
        </Tooltip>
      </div>
    </LazyMotionProvider>
  </Demo>
);
