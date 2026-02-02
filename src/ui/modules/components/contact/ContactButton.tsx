'use client';

import { Button } from '@const/components/ui/button';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const ContactModal = dynamic(() => import('./ContactModal').then((module) => ({ default: module.ContactModal })));

export function ContactButton() {
  const t = useTranslations('footer');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant='ghost' className='text-muted-foreground -ml-4 font-normal'>
        {t('contactUs')}
      </Button>
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
