'use client';

import { Button } from '@ui/components/primitives/button';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const ContactModal = dynamic(() => import('./ContactModal').then((module) => ({ default: module.ContactModal })));

export function ContactButton() {
  const t = useTranslations('footer');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant='ghost'
        className='text-sm font-medium px-1.5 py-0.5 h-auto border-[2px] border-transparent rounded-[4px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-foreground transition-all duration-75'
      >
        {t('contactUs')}
      </Button>
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
