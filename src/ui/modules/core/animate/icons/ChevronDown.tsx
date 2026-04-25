'use client';

import { m, type Variants } from 'motion/react';
import { getVariants, type IconProps, IconWrapper, useAnimateIconContext } from './Icon';

type ChevronDownProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path: {
      initial: {
        y: 0,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
      animate: {
        y: 4,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path: {
      initial: {
        y: 0,
      },
      animate: {
        y: [0, 4, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ChevronDownProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <m.svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}>
      <m.path d='m6 9 6 6 6-6' variants={variants.path} initial='initial' animate={controls} />
    </m.svg>
  );
}

function ChevronDown(props: ChevronDownProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  ChevronDown,
  ChevronDown as ChevronDownIcon,
  type ChevronDownProps as ChevronDownIconProps,
  type ChevronDownProps,
};
