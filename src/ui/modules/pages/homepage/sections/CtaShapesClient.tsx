'use client';

import type { MouseEvent } from 'react';
import { m, useMotionValue, useSpring, useTransform } from 'motion/react';

type CtaShapesProps = {
  byeMonday: string;
  bossOff: string;
  doNotDisturb: string;
  zeroRegrets: string;
};

const SHAPE_SPAN = 'font-display font-black text-[#0e0e0e] leading-tight text-center px-1';
const SHAPE_BASE =
  'hidden md:flex items-center justify-center absolute border-[4px] border-[#fff5e1] dark:border-[#0e0e0e] shadow-[6px_6px_0_0_#fff5e1] dark:shadow-[6px_6px_0_0_#0e0e0e] pointer-events-none';

const SPRING = { stiffness: 80, damping: 20, mass: 0.5 };

export function CtaShapes({ byeMonday, bossOff, doNotDisturb, zeroRegrets }: Readonly<CtaShapesProps>) {
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);

  const springX = useSpring(rawX, SPRING);
  const springY = useSpring(rawY, SPRING);

  // Each shape gets a different depth multiplier for the parallax feel
  const x1 = useTransform(springX, [0, 1], [-14, 14]);
  const y1 = useTransform(springY, [0, 1], [-10, 10]);

  const x2 = useTransform(springX, [0, 1], [10, -10]);
  const y2 = useTransform(springY, [0, 1], [-16, 16]);

  const x3 = useTransform(springX, [0, 1], [-20, 20]);
  const y3 = useTransform(springY, [0, 1], [12, -12]);

  const x4 = useTransform(springX, [0, 1], [16, -16]);
  const y4 = useTransform(springY, [0, 1], [-8, 8]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    rawX.set(0.5);
    rawY.set(0.5);
  };

  return (
    <div className='absolute inset-0' onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} aria-hidden='true'>
      <m.div
        style={{ x: x1, y: y1 }}
        className={`${SHAPE_BASE} size-20 top-14 left-[8%] bg-[var(--color-brand-yellow)] rounded-[12px] rotate-[-12deg]`}
      >
        <span className={`${SHAPE_SPAN} text-[10px]`}>{byeMonday}</span>
      </m.div>
      <m.div
        style={{ x: x2, y: y2 }}
        className={`${SHAPE_BASE} size-14 bottom-20 left-[14%] bg-[var(--color-brand-teal)] rounded-full rotate-[15deg]`}
      >
        <span className={`${SHAPE_SPAN} text-[9px]`}>{bossOff}</span>
      </m.div>
      <m.div
        style={{ x: x3, y: y3 }}
        className={`${SHAPE_BASE} size-[70px] top-24 right-[10%] bg-[var(--color-brand-orange)] rounded-[12px] rotate-[8deg]`}
      >
        <span className={`${SHAPE_SPAN} text-[9px]`}>{doNotDisturb}</span>
      </m.div>
      <m.div
        style={{ x: x4, y: y4 }}
        className={`${SHAPE_BASE} w-24 h-14 bottom-16 right-[7%] bg-[var(--color-brand-purple)] rounded-[12px] rotate-[-6deg]`}
      >
        <span className={`${SHAPE_SPAN} text-[10px]`}>{zeroRegrets}</span>
      </m.div>
    </div>
  );
}
