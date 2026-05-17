'use client';

import type { ReactNode } from 'react';
import { LazyMotion } from 'motion/react';

const loadFeatures = () => import('motion/react').then((res) => res.domAnimation);

export function LazyMotionProvider({ children }: Readonly<{ children: ReactNode }>) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
