'use client';

import { cn } from '@ui/utils/utils';

type OceanSunsetProps = {
  width?: number;
  height?: number;
  gradientId?: string;
  className?: string;
};

export function OceanSunset({
  width = 35,
  height = 35,
  gradientId = 'sunGradOcean',
  className,
}: Readonly<OceanSunsetProps>) {
  return (
    <div className='relative'>
      <svg
        width={width}
        height={height}
        viewBox='0 0 80 88'
        preserveAspectRatio='xMidYMid meet'
        className={cn('absolute right-0.5 transform -translate-y-[30%]', className)}
        aria-hidden='true'
      >
        <defs>
          <linearGradient id={gradientId} x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor='#ff7a45' />
            <stop offset='100%' stopColor='#ffd93d' />
          </linearGradient>
        </defs>
        <path d='M0 40 A40 40 0 1 1 80 40' fill={`url(#${gradientId})`} />
        <rect x='0' y='50' width='80' height='6' fill={`url(#${gradientId})`} />
        <rect x='0' y='65' width='80' height='6' fill={`url(#${gradientId})`} />
        <rect x='0' y='80' width='80' height='6' fill={`url(#${gradientId})`} />
      </svg>
    </div>
  );
}
