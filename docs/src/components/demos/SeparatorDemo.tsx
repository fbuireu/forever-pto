import { Separator } from '@ui/modules/core/primitives/Separator';
import { Demo } from '../Demo';

export const SeparatorDemo = () => (
  <Demo className='flex-col items-stretch'>
    <div>
      <p className='text-sm font-medium'>Annual allowance</p>
      <p className='text-muted-foreground text-sm'>How many PTO days you get per year.</p>
    </div>
    <Separator />
    <div className='flex h-6 items-center gap-4 text-sm'>
      <span>Grouped</span>
      <Separator orientation='vertical' />
      <span>Optimized</span>
      <Separator orientation='vertical' />
      <span>Balanced</span>
    </div>
  </Demo>
);
