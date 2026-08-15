import { Switch } from '@ui/modules/core/animate/primitives/base/Switch';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Label } from '@ui/modules/core/primitives/Label';
import { useState } from 'react';
import { Demo } from '../Demo';

export const SwitchDemo = () => {
  const [checked, setChecked] = useState(true);

  return (
    <Demo>
      <LazyMotionProvider>
        <div className='flex items-center gap-3'>
          <Switch id='demo-carryover' checked={checked} onCheckedChange={(next) => setChecked(next)} />
          <Label htmlFor='demo-carryover'>Carryover {checked ? 'enabled' : 'disabled'}</Label>
        </div>
        <div className='flex items-center gap-3'>
          <Switch id='demo-off' />
          <Label htmlFor='demo-off'>Off by default</Label>
        </div>
        <div className='flex items-center gap-3'>
          <Switch id='demo-locked' disabled defaultChecked />
          <Label htmlFor='demo-locked' className='opacity-50'>
            Disabled
          </Label>
        </div>
      </LazyMotionProvider>
    </Demo>
  );
};
