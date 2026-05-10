'use client';

import { motion } from 'motion/react';

type PalmTreeProps = {
  width?: number;
  height?: number;
  animated?: boolean;
  className?: string;
};

export function PalmTree({ width = 40, height = 40, animated = false, className }: Readonly<PalmTreeProps>) {
  const svgContent = (
    <>
      <rect x='0' y='60' width='18' height='90' rx='6' fill='var(--frame)' />
      <path d='M9 0 C-20 10 -25 40 9 45 C43 40 38 10 9 0z' fill='#a6e368' />
      <path d='M9 20 C-25 30 -30 60 9 65 C48 60 43 30 9 20z' fill='#a6e368' />
    </>
  );

  if (animated) {
    return (
      <motion.svg
        width={width}
        height={height}
        viewBox='-30 0 78 150'
        preserveAspectRatio='xMidYMid meet'
        className={className}
        aria-hidden='true'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 2 }}
      >
        {svgContent}
      </motion.svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox='-30 0 78 150'
      preserveAspectRatio='xMidYMid meet'
      className={className}
      aria-hidden='true'
    >
      {svgContent}
    </svg>
  );
}
