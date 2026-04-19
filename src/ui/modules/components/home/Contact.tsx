'use client';

import { Button } from '@ui/components/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/primitives/card';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import './contact.css';

const ContactModal = dynamic(() =>
  import('../contact/ContactModal').then((module) => ({ default: module.ContactModal })),
);

const GITHUB_ISSUE_URL =
  'https://github.com/fbuireu/forever-pto/issues/new?template=feature_request.yml&labels=enhancement';

export function Contact() {
  const t = useTranslations('roadmap');
  const [contactModalOpen, setContactModalOpen] = useState(false);

  useEffect(() => {
    if (globalThis.location.hash === '#contact') {
      setContactModalOpen(true);
    }
  }, []);

  return (
    <div id='contact' className='container max-w-4xl m-auto'>
      <Card className='dashed-card group relative border-none'>
        <svg
          className='absolute inset-0 w-full h-full pointer-events-none'
          aria-hidden='true'
          xmlns='http://www.w3.org/2000/svg'>
          <rect
            x='0.5'
            y='0.5'
            width='calc(100% - 1px)'
            height='calc(100% - 1px)'
            fill='none'
            strokeWidth='2'
            strokeDasharray='20 12'
            strokeLinecap='round'
            rx='8'
          />
        </svg>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>{t('haveSuggestion')}</CardTitle>
          <CardDescription>{t('feedbackShapes')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground px-3 py-2'>
            <span>{t('gotAnIdea')}</span>
            <Button variant='ghost' className='px-1.5 py-0.5 h-auto text-sm font-semibold' onClick={() => setContactModalOpen(true)}>
              {t('letsTalk')}
            </Button>
            <span>{t('or')}</span>
            <a
              href={GITHUB_ISSUE_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='text-sm font-semibold px-1.5 py-0.5 border-[2px] border-transparent rounded-[4px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-foreground transition-all duration-75'>
              {t('openIssue')}
            </a>
          </div>
        </CardContent>
      </Card>
      <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </div>
  );
}
