'use client';

import { usePremiumStore } from '@application/stores/premium';
import { Button } from '@ui/modules/core/primitives/Button';

interface SupportButtonProps {
  label: string;
  className?: string;
}

export function SupportButton({ label, className }: SupportButtonProps) {
  const setDonatePopoverOpen = usePremiumStore((s) => s.setDonatePopoverOpen);

  return (
    <Button className={className} onClick={() => setDonatePopoverOpen(true)}>
      {label}
    </Button>
  );
}
