'use client';

import { usePremiumStore } from '@application/stores/premium';
import { Button } from '@ui/modules/core/primitives/Button';

interface SupportButtonProps {
  label: string;
  className?: string;
}

export function SupportButton({ label, className }: Readonly<SupportButtonProps>) {
  const openDonatePopover = usePremiumStore((s) => s.openDonatePopover);

  return (
    <Button className={className} variant='outline' onClick={openDonatePopover}>
      {label}
    </Button>
  );
}
