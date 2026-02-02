'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';
import { cn } from '@const/lib/utils';
import { useDetectSticky } from '@ui/hooks/useDetectSticky';
import { MODIFIERS_CLASS_NAMES } from '@ui/modules/components/core/utils/helpers';
import { useTranslations } from 'next-intl';

export const Legend = () => {
  const t = useTranslations('legend');
  const [legendRef, isStuck] = useDetectSticky<HTMLElement>();

  return (
    <section
      ref={legendRef}
      className={cn(
        'sticky bottom-0 z-10 text-center w-full max-w-4xl mx-auto',
        'transition-all duration-300 ease-in-out',
        isStuck ? 'mt-0 text-xs' : 'mt-8 text-sm'
      )}
    >
      <Card className={cn('transition-all duration-300 ease-in-out', isStuck ? 'gap-1 py-2 shadow-lg' : 'gap-4')}>
        <CardHeader className={cn('text-center transition-all duration-300 ease-in-out', isStuck ? 'py-1 pb-0' : '')}>
          <CardTitle
            className={cn('font-bold transition-all duration-300 ease-in-out', isStuck ? 'text-base' : 'text-3xl')}
          >
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className={cn('transition-all duration-300 ease-in-out', isStuck ? 'py-1 pt-0' : '')}>
          <div
            className={cn(
              'flex flex-wrap justify-center transition-all duration-300 ease-in-out',
              isStuck ? 'mb-0 gap-2' : 'mb-2 gap-4'
            )}
          >
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.today)} />
              <span>{t('today')}</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.weekend)} />
              <span>{t('weekends')}</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.holiday)} />
              <span>{t('holidays')}</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.suggested)} />
              <span>{t('suggested')}</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.alternative, 'animate-none')} />
              <span>{t('alternatives')}</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.manuallySelected)} />
              <span>{t('manual')}</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.custom)} />
              <span>{t('custom')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
