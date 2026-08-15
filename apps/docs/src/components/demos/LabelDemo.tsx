import { Input } from '@ui/modules/core/primitives/Input';
import { Label } from '@ui/modules/core/primitives/Label';
import { Demo } from '../Demo';

export const LabelDemo = () => (
  <Demo className='flex-col items-stretch'>
    <div className='grid gap-2'>
      <Label htmlFor='label-demo-days'>PTO days per year</Label>
      <Input id='label-demo-days' type='number' defaultValue={23} min={0} />
    </div>
    <div className='grid gap-2'>
      {/* `peer` on the control lets the label dim itself via peer-disabled */}
      <Input id='label-demo-disabled' className='peer order-2' defaultValue='Disabled control' disabled />
      <Label htmlFor='label-demo-disabled' className='order-1'>
        Dimmed when its peer is disabled
      </Label>
    </div>
  </Demo>
);
