import { Card, CardContent, CardHeader, CardTitle } from '@ui/modules/core/primitives/Card';
import { MODIFIERS_CLASS_NAMES } from '@ui/modules/pages/planner/calendar/utils/helpers';
import { cn } from '@ui/utils/utils';
import { useTranslations } from 'next-intl';
import styles from './legend.module.css';

interface LegendItemsProps {
  className?: string;
  itemClassName?: string;
}

export const LegendItems = ({ className, itemClassName }: LegendItemsProps) => {
  const t = useTranslations('legend');

  return (
    <div className={cn('flex flex-wrap justify-center gap-4 text-sm', className)}>
      <div className={cn('flex items-center', itemClassName)}>
        <div className={cn('mr-2 size-8', MODIFIERS_CLASS_NAMES.today)} />
        <span>{t('today')}</span>
      </div>
      <div className={cn('flex items-center', itemClassName)}>
        <div className={cn('mr-2 size-8', MODIFIERS_CLASS_NAMES.weekend)} />
        <span>{t('weekends')}</span>
      </div>
      <div className={cn('flex items-center', itemClassName)}>
        <div className={cn('mr-2 size-8', MODIFIERS_CLASS_NAMES.holiday)} />
        <span>{t('holidays')}</span>
      </div>
      <div className={cn('flex items-center', itemClassName)}>
        <div className={cn('mr-2 size-8', MODIFIERS_CLASS_NAMES.suggested)} />
        <span>{t('suggested')}</span>
      </div>
      <div className={cn('flex items-center', itemClassName)}>
        <div className={cn('mr-2 size-8', MODIFIERS_CLASS_NAMES.alternative, 'animate-none')} />
        <span>{t('alternatives')}</span>
      </div>
      <div className={cn('flex items-center', itemClassName)}>
        <div className={cn('mr-2 size-8', MODIFIERS_CLASS_NAMES.manuallySelected)} />
        <span>{t('manual')}</span>
      </div>
      <div className={cn('flex items-center', itemClassName)}>
        <div className={cn('mr-2 size-8', MODIFIERS_CLASS_NAMES.custom)} />
        <span>{t('custom')}</span>
      </div>
    </div>
  );
};

export const Legend = () => {
  const t = useTranslations('legend');

  return (
    <div id='legend-sticky' className={cn(styles.sticky_container, 'hidden md:block')}>
      <input type='checkbox' id='legend-toggle' className={styles.toggle} />
      <section className={styles.section}>
        <Card className={styles.card}>
          <CardHeader className={styles.card_header}>
            <CardTitle className={styles.card_title}>{t('title')}</CardTitle>
            <label htmlFor='legend-toggle' className={styles.toggle_label}>
              <span className={styles.show_label}>{t('showLegend')}</span>
              <span className={styles.hide_label}>{t('hideLegend')}</span>
            </label>
          </CardHeader>
          <CardContent className={styles.card_content}>
            <LegendItems className={styles.items} itemClassName={styles.item} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
