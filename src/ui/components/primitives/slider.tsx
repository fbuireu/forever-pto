'use client';

import * as React from 'react';
import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { cn } from '@ui/lib/utils';

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

function Slider({ className, defaultValue, value, min = 0, max = 100, step = 1, onValueChange, onValueCommitted, disabled, id, ...props }: SliderProps) {
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
  const normalizedDefaultValue = Array.isArray(defaultValue) ? defaultValue : defaultValue !== undefined ? defaultValue : undefined;

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
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center">
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
          <SliderPrimitive.Indicator className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
