'use client';

import dynamic from 'next/dynamic';

const Donate = dynamic(
  () => import('@ui/modules/shared/donate/Donate').then((module) => ({ default: module.Donate })),
  {
    ssr: false,
  }
);

export function DonateClient() {
  return <Donate />;
}
