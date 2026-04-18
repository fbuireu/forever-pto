import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/primitives/card';
import { cn } from '@ui/lib/utils';
import { MODIFIERS_CLASS_NAMES } from '@ui/modules/components/core/utils/helpers';
import { useTranslations } from 'next-intl';
import styles from './legend.module.css';

export const Legend = () => {
  const t = useTranslations('legend');

  return (
    <div id='legend-sticky' className={styles.stickyContainer}>
      <section className={styles.section}>
        <Card className={styles.card}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div className={styles.items}>
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
    </div>
  );
};
