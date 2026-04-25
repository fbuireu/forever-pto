'use client';

import { motion } from 'motion/react';

type PalmTreeProps = {
  width?: number;
  height?: number;
  animated?: boolean;
  gradientId?: string;
  className?: string;
};

export function PalmTree({
  width = 40,
  height = 40,
  animated = false,
  gradientId = 'flowGradientPalm',
  className,
}: Readonly<PalmTreeProps>) {
  const svgContent = (
    <>
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
          d='m140.57 152.22c-0.95496-0.18679-1.4007-0.95604-2.0555-3.5476-2.5178-9.9648-2.4284-20.751 0.23784-28.694 1.4005-4.172 3.9176-8.1768 7.0414-11.203 1.0044-0.97305 1.8262-1.8505 1.8262-1.9499 0-0.49681-3.1017-1.0518-5.1457-0.92069-2.7056 0.17353-4.9203 1.0509-7.5246 2.9808-1.075 0.79668-2.2121 1.4485-2.5268 1.4485-2.1967 0-1.2356-3.7 1.7161-6.6062 3.7974-3.7389 9.0182-4.6849 13.526-2.4508 0.8486 0.4206 1.5429 0.66006 1.5429 0.53212 0-0.95844-2.302-3.4453-4.0046-4.3261-1.5636-0.80894-3.4639-1.1655-6.2291-1.1687-2.9921-0.0035-3.5246-0.24377-3.5246-1.5903 0-1.39 1.9386-2.3383 6.0403-2.9545 2.2951-0.34482 5.0364 0.0094 6.7201 0.86838 2.2576 1.1517 4.9666 4.4826 4.9666 6.1065 0 0.26247 0.10208 0.47722 0.22684 0.47722 0.12477 0 1.1169-0.87569 2.2047-1.946 4.2365-4.1683 8.9832-5.1666 13.956-2.9352 2.3402 1.0502 2.9819 2.1809 1.8691 3.2936-0.43944 0.43944-0.88194 0.52917-2.6097 0.52917-3.8339 0-6.4175 0.8281-8.7124 2.7925-2.0782 1.7789-2.0262 1.8377 1.6247 1.8377 2.9889 0 3.3218 0.0524 4.73 0.74384 3.2174 1.58 6.2905 5.6706 6.2905 8.3736 0 1.3226-0.3339 1.8627-1.1514 1.8627-0.29099 0-1.5737-1.0228-2.9382-2.3429-2.906-2.8113-4.0451-3.3111-7.5947-3.3321-1.2604-7e-3 -2.3806 0.0747-2.4892 0.18259s0.23801 1.0428 0.77034 2.0777c0.78797 1.5318 0.96787 2.168 0.96787 3.4226 0 1.3498-0.0866 1.6092-0.69714 2.0895-1.4131 1.1115-2.4608 0.47141-3.2857-2.0075-0.44952-1.3508-0.91194-2.0984-1.9801-3.2012-1.1663-1.2042-1.4949-1.4077-2.0148-1.2482-1.8373 0.56378-4.7868 4.0596-6.6918 7.9313-2.4521 4.9836-3.4715 10.432-3.2424 17.33 0.15227 4.585 0.49265 6.9307 1.8184 12.531 0.88762 3.7497 0.8228 4.45-0.45692 4.9366-0.67514 0.25668-2.1029 0.29067-3.1996 0.0762z'
        />
      </g>
    </>
  );

  if (animated) {
    return (
      <motion.svg
        width={width}
        height={height}
        viewBox='133.5 84 29 69'
        preserveAspectRatio='xMidYMid meet'
        className={className}
        aria-hidden='true'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: 'easeOut',
          delay: 2,
        }}
      >
        {svgContent}
      </motion.svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox='133.5 84 29 69'
      preserveAspectRatio='xMidYMid meet'
      className={className}
      aria-hidden='true'
    >
      {svgContent}
    </svg>
  );
}
