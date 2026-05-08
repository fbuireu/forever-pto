import { Link } from '@application/i18n/navigtion';
import { Badge } from '@ui/modules/core/primitives/Badge';
import { Button } from '@ui/modules/core/primitives/Button';
import { cn } from '@ui/utils/utils';
import { getTranslations } from 'next-intl/server';
import { SupportButton } from '../navigation/SupportButton';
import { brutCard } from './shared';

export const Pricing = async () => {
  const t = await getTranslations('homepage');

  return (
    <section className='px-7 py-24 bg-[var(--surface-panel-alt)] border-y-[4px] border-[var(--frame)]' id='pricing'>
      <div className='max-w-[900px] mx-auto mb-14 text-center'>
        <div className='flex justify-center mb-4'>
          <Badge variant='outline'>{t('pricing.badge')}</Badge>
        </div>
        <h2 className='font-display font-extrabold leading-none tracking-[-0.03em] mb-4 text-[clamp(36px,5vw,64px)]'>
          {t('pricing.titleStart')} <em className='font-serif italic'>{t('pricing.titleEmphasis')}</em>
        </h2>
        <p className='text-[19px] text-muted-foreground max-w-[640px] mx-auto'>{t('pricing.description')}</p>
      </div>

      <div className='max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-7'>
        <div
          className={cn(
            brutCard,
            'p-8 transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--frame)]'
          )}
        >
          <h3 className='font-display font-extrabold text-[28px] tracking-[-0.02em] mb-2'>{t('pricing.freeName')}</h3>
          <p className='text-[14px] text-muted-foreground mb-4'>{t('pricing.freeTagline')}</p>
          <div className='font-display font-extrabold text-[64px] leading-none tracking-[-0.04em] mb-1.5'>
            {t('pricing.freePrice')}
            <span className='text-[18px] text-muted-foreground font-semibold'>{t('pricing.freePer')}</span>
          </div>
          <p className='font-mono text-[12px] text-muted-foreground mb-5'>{t('pricing.freeNote')}</p>
          <ul className='list-none mb-6'>
            {(
              [
                'pricing.freeFeatures.optimizedPlan',
                'pricing.freeFeatures.countryHolidays',
                'pricing.freeFeatures.threeStrategies',
                'pricing.freeFeatures.basicStats',
              ] as const
            ).map((key) => (
              <li
                key={key}
                className='flex gap-2.5 py-2 border-b-[2px] border-dashed border-black/15 last:border-b-0 text-[15px]'
              >
                <span className='font-black'>✓</span>{' '}
                {key === 'pricing.freeFeatures.threeStrategies' ? t(key, { count: 3 }) : t(key)}
              </li>
            ))}
          </ul>
          <Button variant='outline' className='w-full justify-center' asChild>
            <Link href='/planner'>{t('pricing.freeCta')}</Link>
          </Button>
        </div>
        <div
          className={cn(
            brutCard,
            'p-8 relative rotate-[-1deg] transition-all duration-75 hover:rotate-0 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--frame)]'
          )}
          style={{ background: 'var(--accent)', color: 'var(--color-brand-ink)' }}
        >
          <div className='absolute -top-4 right-[22px] bg-[var(--frame)] text-[var(--background)] font-mono font-bold text-[12px] uppercase tracking-[0.08em] px-3 py-1.5 rounded-[6px] rotate-[4deg]'>
            {t('pricing.popularBadge')}
          </div>
          <h3 className='font-display font-extrabold text-[28px] tracking-[-0.02em] mb-2'>
            {t('pricing.lifetimeName')}
          </h3>
          <p className='text-[14px] text-[var(--color-brand-ink)]/60 mb-4'>{t('pricing.lifetimeTagline')}</p>
          <div className='font-display font-extrabold text-[64px] leading-none tracking-[-0.04em] mb-1.5'>
            {t('pricing.lifetimePrice')}
            <span className='text-[18px] text-[var(--color-brand-ink)]/60 font-semibold'>
              {t('pricing.lifetimePer')}
            </span>
          </div>
          <p className='font-mono text-[12px] text-[var(--color-brand-ink)]/60 mb-5'>{t('pricing.lifetimeNote')}</p>
          <ul className='list-none mb-6'>
            {(
              [
                'pricing.lifetimeFeatures.manualEditing',
                'pricing.lifetimeFeatures.calendarExport',
                'pricing.lifetimeFeatures.customHolidays',
                'pricing.lifetimeFeatures.pastDaysAndCarryover',
                'pricing.lifetimeFeatures.holidayManagement',
                'pricing.lifetimeFeatures.fullAnalytics',
              ] as const
            ).map((key) => (
              <li
                key={key}
                className='flex gap-2.5 py-2 border-b-[2px] border-dashed border-black/15 last:border-b-0 text-[15px]'
              >
                <span className='font-black'>✓</span> {t(key)}
              </li>
            ))}
          </ul>
          <SupportButton
            label={t('pricing.lifetimeCta')}
            className='w-full justify-center !bg-[var(--color-brand-ink)] !text-white !border-transparent !shadow-[5px_5px_0_0_var(--color-brand-orange)] hover:!shadow-[7px_7px_0_0_var(--color-brand-orange)] active:!shadow-[1px_1px_0_0_var(--color-brand-orange)]'
          />
        </div>
      </div>
    </section>
  );
};
