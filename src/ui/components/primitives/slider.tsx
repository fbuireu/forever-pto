'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { cn } from '@ui/lib/utils';
import * as React from 'react';

interface SliderProps {
  className?: string;
  defaultValue?: number | number[];
  value?: number | number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  onValueCommitted?: (value: number[]) => void;
  disabled?: boolean;
  id?: string;
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onValueCommitted,
  disabled,
  id,
  ...props
}: SliderProps) {
  // Normalize value: base-ui may pass number or readonly number[], consumers expect number[]
  const handleValueChange = React.useCallback(
    (val: number | readonly number[]) => {
      if (!onValueChange) return;
      const normalized = Array.isArray(val) ? [...val] : [val as number];
      onValueChange(normalized);
    },
    [onValueChange]
  );

  const handleValueCommitted = React.useCallback(
    (val: number | readonly number[]) => {
      if (!onValueCommitted) return;
      const normalized = Array.isArray(val) ? [...val] : [val as number];
      onValueCommitted(normalized);
    },
    [onValueCommitted]
  );

  // Normalize value/defaultValue for base-ui (it accepts number | readonly number[])
  const normalizedValue = Array.isArray(value) ? value : value !== undefined ? value : undefined;
  const normalizedDefaultValue = Array.isArray(defaultValue)
    ? defaultValue
    : defaultValue !== undefined
      ? defaultValue
      : undefined;

  return (
    <SliderPrimitive.Root
      id={id}
      defaultValue={normalizedDefaultValue}
      value={normalizedValue}
      min={min}
      max={max}
      step={step}
      onValueChange={onValueChange ? handleValueChange : undefined}
      onValueCommitted={onValueCommitted ? handleValueCommitted : undefined}
      disabled={disabled}
      className={cn('relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50', className)}
      {...props}
    >
      <SliderPrimitive.Control className='relative flex w-full touch-none items-center'>
        <SliderPrimitive.Track className='relative h-4 w-full grow overflow-hidden rounded-full bg-[var(--surface-panel-alt)] border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-xs)]'>
          <SliderPrimitive.Indicator className='absolute h-full bg-[var(--frame)]' />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className='block h-7 w-7 rounded-full border-[3px] border-[var(--frame)] bg-accent shadow-[var(--shadow-brutal-xs)] transition-all duration-75 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] disabled:pointer-events-none disabled:opacity-50' />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
