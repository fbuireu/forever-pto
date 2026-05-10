'use client';

import { m, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

type CtaShapesProps = {
  byeMonday: string;
  bossOff: string;
  doNotDisturb: string;
  zeroRegrets: string;
};

const SHAPE_SPAN = 'font-display font-black text-[#0e0e0e] leading-tight text-center px-1';
const SHAPE_BASE =
  'hidden md:flex items-center justify-center absolute border-[4px] border-[#fff5e1] dark:border-[#0e0e0e] shadow-[6px_6px_0_0_#fff5e1] dark:shadow-[6px_6px_0_0_#0e0e0e]';

export function CtaShapes({ byeMonday, bossOff, doNotDisturb, zeroRegrets }: Readonly<CtaShapesProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const y1 = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-20, 30]);
  const y3 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const y4 = useTransform(scrollYProgress, [0, 1], [-15, 25]);

  return (
    <div ref={ref} className='absolute inset-0 pointer-events-none'>
      <m.div
        aria-hidden='true'
        style={{ y: y1 }}
        className={`${SHAPE_BASE} w-20 h-20 top-14 left-[8%] bg-[var(--color-brand-yellow)] rounded-[12px] rotate-[-12deg]`}
      >
        <span className={`${SHAPE_SPAN} text-[10px]`}>{byeMonday}</span>
      </m.div>
      <m.div
        aria-hidden='true'
        style={{ y: y2 }}
        className={`${SHAPE_BASE} w-14 h-14 bottom-20 left-[14%] bg-[var(--color-brand-teal)] rounded-full rotate-[15deg]`}
      >
        <span className={`${SHAPE_SPAN} text-[9px]`}>{bossOff}</span>
      </m.div>
      <m.div
        aria-hidden='true'
        style={{ y: y3 }}
        className={`${SHAPE_BASE} w-[70px] h-[70px] top-24 right-[10%] bg-[var(--color-brand-orange)] rounded-[12px] rotate-[8deg]`}
      >
        <span className={`${SHAPE_SPAN} text-[9px]`}>{doNotDisturb}</span>
      </m.div>
      <m.div
        aria-hidden='true'
        style={{ y: y4 }}
        className={`${SHAPE_BASE} w-24 h-14 bottom-16 right-[7%] bg-[var(--color-brand-purple)] rounded-[12px] rotate-[-6deg]`}
      >
        <span className={`${SHAPE_SPAN} text-[10px]`}>{zeroRegrets}</span>
      </m.div>
    </div>
  );
}
