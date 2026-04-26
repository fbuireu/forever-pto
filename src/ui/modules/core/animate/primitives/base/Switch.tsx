'use client';

import { Switch as SwitchPrimitives } from '@base-ui/react/switch';
import { getStrictContext } from '@ui/utils/context';
import { cn } from '@ui/utils/utils';
import { Check, X } from 'lucide-react';
import {
  type HTMLMotionProps,
  type LegacyAnimationControls,
  m,
  type TargetAndTransition,
  type VariantLabels,
} from 'motion/react';
import { type ComponentProps, type ReactNode, useMemo, useState } from 'react';
import { useControlledState } from 'src/ui/hooks/useControlledState';

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

  return (
    <SwitchProvider value={{ isChecked, setIsChecked, isPressed, setIsPressed }}>
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
              'group/switch relative inline-flex h-8 w-[60px] shrink-0 cursor-pointer items-center justify-start overflow-hidden rounded-full border-[3px] border-[var(--frame)] bg-white p-0 shadow-[3px_3px_0_0_var(--frame)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[color-mix(in_srgb,var(--frame)_65%,white_35%)] disabled:bg-[color-mix(in_srgb,white_92%,var(--surface-panel-soft)_8%)] disabled:shadow-[3px_3px_0_0_color-mix(in_srgb,var(--frame)_45%,transparent)]',
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
            'pointer-events-none absolute left-px top-px flex size-[22px] shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--frame)] bg-[var(--frame)] text-white [--switch-thumb-shadow:var(--accent)] shadow-[2px_1px_0_0_var(--switch-thumb-shadow)] transition-all duration-75 ease-linear group-hover/switch:shadow-[3px_2px_0_0_var(--switch-thumb-shadow)] group-disabled/switch:opacity-50 data-[checked]:translate-x-[28px] data-[checked]:bg-[var(--accent)] data-[checked]:text-[var(--frame)] data-[checked]:[--switch-thumb-shadow:var(--frame)]',
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

type SwitchIconPosition = 'left' | 'right' | 'thumb';
type SwitchIconProps = HTMLMotionProps<'div'> & {
  position: SwitchIconPosition;
  children?: ReactNode;
};

function SwitchIcon({
  position,
  transition = { type: 'spring', bounce: 0 },
  children,
  className,
  ...props
}: SwitchIconProps) {
  const { isChecked } = useSwitch();
  const isAnimated = useMemo(() => {
    if (position === 'right') return !isChecked;
    if (position === 'left') return isChecked;
    if (position === 'thumb') return true;
    return false;
  }, [position, isChecked]);

  const positionClassName =
    position === 'left'
      ? 'absolute left-[6px] top-1/2 -translate-y-1/2 text-[var(--frame)]'
      : position === 'right'
        ? 'absolute right-[6px] top-1/2 -translate-y-1/2 text-[var(--frame)]'
        : 'text-[var(--frame)]';

  const defaultIcon =
    children ??
    (position === 'left' ? (
      <Check className='size-2.5' strokeWidth={3} />
    ) : position === 'right' ? (
      <X className='size-2.5' strokeWidth={3} />
    ) : (
      <div className='size-1.5 rounded-full bg-current' />
    ));

  return (
    <m.div
      data-slot={`switch-${position}-icon`}
      animate={isAnimated ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={transition}
      className={cn('flex items-center justify-center', positionClassName, className)}
      {...props}
    >
      {defaultIcon}
    </m.div>
  );
}

export {
  Switch,
  type SwitchContextType,
  SwitchIcon,
  type SwitchIconPosition,
  type SwitchIconProps,
  type SwitchProps,
  SwitchThumb,
  type SwitchThumbProps,
  useSwitch,
};
