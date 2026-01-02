'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { type HTMLMotionProps, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@const/lib/utils';

type CheckboxProps = Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, 'render'> & {
  motionProps?: HTMLMotionProps<'button'>;
};

function Checkbox({ className, onCheckedChange, motionProps, ...props }: CheckboxProps) {
  const [isChecked, setIsChecked] = useState(props?.checked ?? props?.defaultChecked ?? false);

  useEffect(() => {
    if (props?.checked !== undefined) setIsChecked(props.checked);
  }, [props?.checked]);

  const handleCheckedChange = useCallback(
    (checked: boolean, eventDetails: CheckboxPrimitive.Root.ChangeEventDetails) => {
      setIsChecked(checked);
      onCheckedChange?.(checked, eventDetails);
    },
    [onCheckedChange]
  );

  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      className={cn(
        'peer shrink-0 flex items-center justify-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-500',
        'size-5 rounded-sm bg-input focus-visible:ring-offset-2 data-[checked]:bg-primary data-[checked]:text-primary-foreground cursor-pointer',
        className
      )}
      {...props}
      onCheckedChange={handleCheckedChange}
      render={<motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} {...motionProps} />}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        data-slot='checkbox-indicator'
        className='flex items-center justify-center text-current transition-none'
      >
        <motion.svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='3.5'
          stroke='currentColor'
          className='size-3.5'
          initial='unchecked'
          animate={isChecked ? 'checked' : 'unchecked'}
        >
          <motion.path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M4.5 12.75l6 6 9-13.5'
            variants={{
              checked: {
                pathLength: 1,
                opacity: 1,
                transition: {
                  duration: 0.2,
                  delay: 0.2,
                },
              },
              unchecked: {
                pathLength: 0,
                opacity: 0,
                transition: {
                  duration: 0.2,
                },
              },
            }}
          />
        </motion.svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, type CheckboxProps };
