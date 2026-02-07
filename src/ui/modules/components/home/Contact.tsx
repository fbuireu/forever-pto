'use client';

import { Button } from '@const/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@const/components/ui/card';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import './contact.css';

const ContactModal = dynamic(() =>
  import('../contact/ContactModal').then((module) => ({ default: module.ContactModal }))
);

const GITHUB_ISSUE_URL =
  'https://github.com/fbuireu/forever-pto/issues/new?template=feature_request.md&labels=enhancement';

export function Contact() {
  const t = useTranslations('roadmap');
  const [contactModalOpen, setContactModalOpen] = useState(false);

  return (
    <div className='container max-w-4xl m-auto'>
      <Card className='dashed-card group relative border-none'>
        <svg className='absolute inset-0 w-full h-full pointer-events-none' xmlns='http://www.w3.org/2000/svg'>
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
          <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            <span>{t('gotAnIdea')}</span>
            <Button
              variant='ghost'
              onClick={() => setContactModalOpen(true)}
              className='font-semibold text-foreground hover:text-primary transition-colors underline decoration-primary/30 hover:decoration-primary underline-offset-4'
            >
              {t('letsTalk')}
            </Button>
            <span>{t('or')}</span>
            <a
              href={GITHUB_ISSUE_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='font-semibold text-foreground hover:text-primary transition-colors underline decoration-primary/30 hover:decoration-primary underline-offset-4'
            >
              {t('openIssue')}
            </a>
          </div>
        </CardContent>
      </Card>
      <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </div>
  );
}
