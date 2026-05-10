'use client';

import dynamic from 'next/dynamic';

export const CtaShapes = dynamic(() => import('./CtaShapes').then((m) => ({ default: m.CtaShapes })), { ssr: false });
