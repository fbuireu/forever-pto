'use client';

import { cn } from '@const/lib/utils';

type OceanSunsetProps = {
  width?: number;
  height?: number;
  gradientId?: string;
  className?: string;
};

export function OceanSunset({
  width = 35,
  height = 35,
  gradientId = 'flowGradientOcean',
  className,
}: Readonly<OceanSunsetProps>) {
  return (
    <div className='relative'>
      <svg
        width={width}
        height={height}
        viewBox='147 108 33 40'
        className={cn('absolute right-0.5 transform -translate-y-[30%]', className)}
      >
        <defs>
          <linearGradient id={gradientId} x1='0%' y1='0%' x2='700%' y2='0%'>
            <stop offset='0%' stopColor='var(--color-brand-yellow)' />
            <stop offset='14.28%' stopColor='var(--color-brand-teal)' />
            <stop offset='28.56%' stopColor='var(--color-brand-orange)' />
            <stop offset='42.84%' stopColor='var(--color-brand-purple)' />
            <stop offset='57.12%' stopColor='var(--color-brand-yellow)' />
            <stop offset='71.4%' stopColor='var(--color-brand-teal)' />
            <stop offset='85.68%' stopColor='var(--color-brand-orange)' />
            <stop offset='100%' stopColor='var(--color-brand-yellow)' />
            <animateTransform
              attributeName='gradientTransform'
              type='translate'
              values='0 0; -1 0; 0 0'
              dur='5s'
              repeatCount='indefinite'
              calcMode='linear'
            />
          </linearGradient>
        </defs>

        <g transform='translate(.28919 -6.073)' strokeWidth='.26458'>
          <path
            fill={`url(#${gradientId})`}
            d='m147.72 136.72c-0.33342-1.0159-0.18139-4.7797 0.26521-6.5658 0.23412-0.93634 0.869-2.5954 1.4108-3.6868 1.3198-2.6585 4.7284-6.1084 7.2501-7.338 6.1332-2.9907 13.447-1.9025 18.47 2.7481 3.5322 3.2703 5.3587 7.2572 5.3755 11.734 5e-3 1.3824-0.0756 2.7814-0.17957 3.1089l-0.18899 0.59531h-32.208z'
          />
          <path
            fill={`url(#${gradientId})`}
            d='m150.42 144.79c-1.3542-1.2-1.8095-1.8-1.4904-2.1 0.268-0.3 1.3499-0.35 13.548-0.4 8.8423-0.03 13.527-0.01 13.854 0.05 0.36596 0.06 0.59532 0.25 0.59532 0.45 0 0.4-1.6775 2.3-2.3318 2.6-0.31897 0.18-3.1161 0.24-11.931 0.24h-11.515z'
          />
          <path
            fill={`url(#${gradientId})`}
            d='m161.56 152.1c-2.8256-0.28206-6.3846-1.7404-6.5677-2.6912-0.0809-0.42032 0.49372-0.44757 8.0689-0.38255 7.0327 0.0603 8.1561 0.12452 8.1561 0.46582 0 0.42781-2.0727 1.6674-3.5719 2.1362-1.4315 0.44764-4.187 0.66126-6.0854 0.47176z'
          />
        </g>
      </svg>
    </div>
  );
}
