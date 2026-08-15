import { Slider } from '@ui/modules/core/primitives/Slider';
import { useState } from 'react';
import { Demo } from '../Demo';

export const SliderDemo = () => {
  const [value, setValue] = useState([15]);

  return (
    <Demo className='flex-col items-stretch'>
      <Slider value={value} onValueChange={setValue} min={0} max={30} step={1} />
      <p className='m-0 font-mono text-sm font-bold'>{value[0]} PTO days</p>
    </Demo>
  );
};

export const SliderRangeDemo = () => {
  const [range, setRange] = useState([8, 22]);

  return (
    <Demo className='flex-col items-stretch'>
      <Slider value={range} onValueChange={setRange} min={0} max={31} step={1} />
      <p className='m-0 font-mono text-sm font-bold'>
        Day {range[0]} → day {range[1]}
      </p>
    </Demo>
  );
};

export const SliderDisabledDemo = () => (
  <Demo>
    <Slider defaultValue={10} max={30} disabled className='max-w-sm' />
  </Demo>
);
