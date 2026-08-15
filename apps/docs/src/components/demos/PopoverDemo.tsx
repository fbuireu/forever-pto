import { Popover, PopoverContent, PopoverTrigger } from '@ui/modules/core/animate/base/Popover';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Button } from '@ui/modules/core/primitives/Button';
import { Demo } from '../Demo';

export const PopoverDemo = () => (
  <Demo>
    <LazyMotionProvider>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline'>Open popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className='m-0 text-sm font-bold'>Anchored panel</p>
          <p className='m-0 mt-1 text-sm text-muted-foreground'>
            Springs from scale 0.5 to 1 out of the trigger. Click outside or press Esc to close.
          </p>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='secondary'>Aligned to start</Button>
        </PopoverTrigger>
        <PopoverContent align='start' sideOffset={8} className='w-56'>
          <p className='m-0 text-sm'>align='start' and sideOffset={'{8}'} on this one.</p>
        </PopoverContent>
      </Popover>
    </LazyMotionProvider>
  </Demo>
);
