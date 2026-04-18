'use client';

import { cn } from '@ui/lib/utils';
import { type ReactNode, useCallback } from 'react';
import {
  SwitchIcon as BaseSwitchIcon,
  Switch as BaseSwitchPrimitive,
  type SwitchProps as BaseSwitchPrimitiveProps,
  SwitchThumb as BaseSwitchThumb,
} from '../primitives/base/switch';

type SwitchProps = Omit<BaseSwitchPrimitiveProps, 'onCheckedChange'> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  thumbIcon?: ReactNode;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
};

function Switch({
  className,
  leftIcon,
  rightIcon,
  thumbIcon,
  onChange,
  onCheckedChange,
  checked,
  defaultChecked,
  ...props
}: SwitchProps) {
  const handleCheckedChange = useCallback(
    (value: boolean) => {
      onChange?.(value);
      onCheckedChange?.(value);
    },
    [onChange, onCheckedChange]
  );

  return (
    <BaseSwitchPrimitive
      data-slot='switch'
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={handleCheckedChange}
      className={cn(
        'relative flex p-[3px] h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary bg-input data-[checked]:justify-end justify-start',
        className
      )}
      {...props}
    >
      {leftIcon && (
        <BaseSwitchIcon
          position='left'
          className='absolute [&_svg]:size-3 left-1 top-1/2 -translate-y-1/2 dark:text-neutral-500 text-neutral-400'
        >
          {typeof leftIcon !== 'string' ? leftIcon : null}
        </BaseSwitchIcon>
      )}

      {rightIcon && (
        <BaseSwitchIcon
          position='right'
          className='absolute [&_svg]:size-3 right-1 top-1/2 -translate-y-1/2 dark:text-neutral-400 text-neutral-500'
        >
          {typeof rightIcon !== 'string' ? rightIcon : null}
        </BaseSwitchIcon>
      )}

      <BaseSwitchThumb
        className={cn(
          'relative z-[1] [&_svg]:size-3 flex items-center justify-center rounded-full bg-background shadow-lg ring-0 dark:text-neutral-400 text-neutral-500'
        )}
        pressedAnimation={{ width: 21 }}
        style={{ width: 18, height: 18 }}
      >
        {thumbIcon && typeof thumbIcon !== 'string' ? (
          <BaseSwitchIcon position='thumb' className='absolute inset-0 flex items-center justify-center'>
            {thumbIcon}
          </BaseSwitchIcon>
        ) : null}
      </BaseSwitchThumb>
    </BaseSwitchPrimitive>
  );
}

export { Switch, type SwitchProps };
