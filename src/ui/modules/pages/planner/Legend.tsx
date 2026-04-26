import { Card, CardContent, CardHeader, CardTitle } from '@ui/modules/core/primitives/Card';
import { MODIFIERS_CLASS_NAMES } from '@ui/modules/pages/planner/calendar/utils/helpers';
import { cn } from '@ui/utils/utils';
import { useTranslations } from 'next-intl';
import styles from './legend.module.css';

export const Legend = () => {
  const t = useTranslations('legend');

  return (
    <div id='legend-sticky' className={styles.stickyContainer}>
      <input type='checkbox' id='legend-toggle' className={styles.toggle} />
      <section className={styles.section}>
        <Card className={styles.card}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>{t('title')}</CardTitle>
            <label htmlFor='legend-toggle' className={styles.toggleLabel}>
              <span className={styles.showLabel}>{t('showLegend')}</span>
              <span className={styles.hideLabel}>{t('hideLegend')}</span>
            </label>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div className={styles.items}>
              <div className={cn('flex items-center', styles.item)}>
                <div className={cn('mr-2 h-8 w-8', MODIFIERS_CLASS_NAMES.today)} />
                <span>{t('today')}</span>
              </div>
              <div className={cn('flex items-center', styles.item)}>
                <div className={cn('mr-2 h-8 w-8', MODIFIERS_CLASS_NAMES.weekend)} />
                <span>{t('weekends')}</span>
              </div>
              <div className={cn('flex items-center', styles.item)}>
                <div className={cn('mr-2 h-8 w-8', MODIFIERS_CLASS_NAMES.holiday)} />
                <span>{t('holidays')}</span>
              </div>
              <div className={cn('flex items-center', styles.item)}>
                <div className={cn('mr-2 h-8 w-8', MODIFIERS_CLASS_NAMES.suggested)} />
                <span>{t('suggested')}</span>
              </div>
              <div className={cn('flex items-center', styles.item)}>
                <div className={cn('mr-2 h-8 w-8', MODIFIERS_CLASS_NAMES.alternative, 'animate-none')} />
                <span>{t('alternatives')}</span>
              </div>
              <div className={cn('flex items-center', styles.item)}>
                <div className={cn('mr-2 h-8 w-8', MODIFIERS_CLASS_NAMES.manuallySelected)} />
                <span>{t('manual')}</span>
              </div>
              <div className={cn('flex items-center', styles.item)}>
                <div className={cn('mr-2 h-8 w-8', MODIFIERS_CLASS_NAMES.custom)} />
                <span>{t('custom')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
