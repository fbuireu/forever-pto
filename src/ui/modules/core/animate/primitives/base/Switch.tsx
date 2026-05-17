'use client';

import { Switch as SwitchPrimitives } from '@base-ui/react/switch';
import { useControlledState } from '@ui/hooks/useControlledState';
import { cn } from '@ui/utils/cn';
import { getStrictContext } from '@ui/utils/context';
import {
  type HTMLMotionProps,
  type LegacyAnimationControls,
  m,
  type TargetAndTransition,
  type VariantLabels,
} from 'motion/react';
import { type ComponentProps, useMemo, useState } from 'react';

type SwitchContextType = {
  isChecked: boolean;
  setIsChecked: SwitchProps['onCheckedChange'];
  isPressed: boolean;
  setIsPressed: (isPressed: boolean) => void;
};

const [SwitchProvider, useSwitch] = getStrictContext<SwitchContextType>('SwitchContext');

type SwitchProps = Omit<ComponentProps<typeof SwitchPrimitives.Root>, 'render'> &
  Omit<HTMLMotionProps<'button'>, 'onChange'>;

function Switch({
  name,
  defaultChecked,
  checked,
  onCheckedChange,
  nativeButton,
  disabled,
  readOnly,
  required,
  inputRef,
  id,
  className,
  children,
  onTapStart,
  onTapCancel,
  onTap,
  ...props
}: SwitchProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isChecked, setIsChecked] = useControlledState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });

  const switchChildren = children ?? <SwitchThumb />;

  const switchContextValue = useMemo(
    () => ({ isChecked, setIsChecked, isPressed, setIsPressed }),
    [isChecked, setIsChecked, isPressed]
  );
  return (
    <SwitchProvider value={switchContextValue}>
      <SwitchPrimitives.Root
        name={name}
        defaultChecked={defaultChecked}
        checked={checked}
        onCheckedChange={setIsChecked}
        nativeButton={nativeButton ?? true}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        inputRef={inputRef}
        id={id}
        render={
          <m.button
            data-slot='switch'
            whileTap='tap'
            initial={false}
            onTapStart={(event, info) => {
              setIsPressed(true);
              onTapStart?.(event, info);
            }}
            onTapCancel={(event, info) => {
              setIsPressed(false);
              onTapCancel?.(event, info);
            }}
            onTap={(event, info) => {
              setIsPressed(false);
              onTap?.(event, info);
            }}
            className={cn(
              'group/switch relative inline-flex h-8 w-[60px] shrink-0 cursor-pointer items-center justify-start overflow-hidden rounded-full border-[3px] border-[var(--frame)] bg-[var(--input)] p-0 shadow-[var(--shadow-brutal-3)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[color-mix(in_srgb,var(--frame)_65%,transparent_35%)] disabled:bg-[var(--muted)] disabled:shadow-[3px_3px_0_0_color-mix(in_srgb,var(--frame)_45%,transparent)]',
              className
            )}
            {...props}
          />
        }
      >
        {switchChildren}
      </SwitchPrimitives.Root>
    </SwitchProvider>
  );
}

type SwitchThumbProps = Omit<ComponentProps<typeof SwitchPrimitives.Thumb>, 'render'> &
  HTMLMotionProps<'div'> & {
    pressedAnimation?: TargetAndTransition | VariantLabels | boolean | LegacyAnimationControls;
  };

function SwitchThumb({
  pressedAnimation,
  transition = { duration: 0.15, ease: 'linear' },
  className,
  children,
  ...props
}: SwitchThumbProps) {
  const { isPressed } = useSwitch();

  const thumbContent = children ?? null;
  const thumbAnimation = isPressed ? pressedAnimation : undefined;

  return (
    <SwitchPrimitives.Thumb
      render={
        <m.div
          data-slot='switch-thumb'
          whileTap='tap'
          initial={false}
          transition={transition}
          animate={thumbAnimation}
          className={cn(
            'pointer-events-none absolute left-px top-px flex size-[24px] shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--frame)] bg-[var(--frame)] text-white transition-all duration-75 ease-linear group-disabled/switch:opacity-50 data-[checked]:translate-x-[28px] data-[checked]:bg-[var(--accent)] data-[checked]:text-[var(--frame)]',
            className
          )}
          {...props}
        >
          {thumbContent}
        </m.div>
      }
    />
  );
}

export { Switch };
