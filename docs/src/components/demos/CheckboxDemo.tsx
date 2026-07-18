import { Checkbox } from '@ui/modules/core/animate/base/Checkbox';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Label } from '@ui/modules/core/primitives/Label';
import { useState } from 'react';
import { Demo } from '../Demo';

export const CheckboxDemo = () => {
  const [checked, setChecked] = useState(true);

  return (
    <Demo>
      <LazyMotionProvider>
        <div className='flex items-center gap-3'>
          <Checkbox id='demo-holidays' checked={checked} onCheckedChange={(next) => setChecked(next)} />
          <Label htmlFor='demo-holidays'>Include regional holidays {checked ? '(on)' : '(off)'}</Label>
        </div>
        <div className='flex items-center gap-3'>
          <Checkbox id='demo-unchecked' />
          <Label htmlFor='demo-unchecked'>Unchecked by default</Label>
        </div>
        <div className='flex items-center gap-3'>
          <Checkbox id='demo-disabled' disabled defaultChecked />
          <Label htmlFor='demo-disabled' className='opacity-50'>
            Disabled
          </Label>
        </div>
      </LazyMotionProvider>
    </Demo>
  );
};
