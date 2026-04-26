import { Link } from '@application/i18n/navigtion';
import { Badge } from '@ui/modules/core/primitives/Badge';
import { Button } from '@ui/modules/core/primitives/Button';
import { getWeekdayNames } from '@ui/utils/dates';
import { getLocale, getTranslations } from 'next-intl/server';
import { version } from '../../../../../../package.json';
import { CAL_ENTRIES, type DayType, dayCell } from './shared';

export const Hero = async () => {
  const [t, locale] = await Promise.all([getTranslations('homepage'), getLocale()]);
  const DAY_HEADERS = getWeekdayNames({ locale, weekStartsOn: 1, format: 'narrow' });

  return (
    <header className='relative px-7 pt-20 pb-24 overflow-hidden' id='hero'>
      <div className='max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-14 items-center'>
        <div>
          <div className='flex gap-2.5 items-center mb-6 flex-wrap'>
            <Badge variant='outline'>{t('hero.badge1')}</Badge>
            <Badge variant='outline'>v{version}</Badge>
          </div>

          <h1 className='font-display font-extrabold leading-[0.95] tracking-[-0.035em] mb-7 text-[clamp(48px,7vw,92px)]'>
            {t('hero.line1')}
            <br />
            {t('hero.verb')}{' '}
            <span className='relative inline-block bg-[var(--accent)] px-3 pb-1 border-[4px] border-[var(--frame)] rounded-[10px] shadow-[5px_5px_0_0_var(--frame)] rotate-[-2deg] mx-1'>
              {t('hero.highlight')}
            </span>
            <span className='inline-block text-[0.75em] rotate-[15deg]'>🌴</span>
          </h1>

          <p className='text-[21px] leading-[1.45] max-w-[540px] mb-8 text-foreground'>
            {t.rich('hero.description', {
              em: (chunks) => <em className='font-serif font-normal italic text-[1.08em]'>{chunks}</em>,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>

          <div className='flex gap-4 flex-wrap items-center mb-7'>
            <Button variant='accent' size='lg' asChild>
              <Link href='/planner'>{t('hero.cta1')}</Link>
            </Button>
            <Button variant='outline' size='lg' asChild>
              <a href='#how'>{t('hero.cta2')}</a>
            </Button>
          </div>

          <div className='flex gap-2.5 items-center font-mono text-sm'>
            <span className='text-[#FFB800] tracking-[2px] text-lg'>★★★★★</span>
            <span>{t('hero.stars', { users: '12.847' })}</span>
          </div>
        </div>

        <div className='bg-card border-[5px] border-[var(--frame)] rounded-[14px] shadow-[10px_10px_0_0_var(--frame)] overflow-hidden rotate-[1.2deg] hover:rotate-0 transition-transform duration-[250ms] ease-out'>
          <div className='flex items-center gap-2.5 px-4 py-[10px] bg-[var(--frame)]'>
            <div className='w-3 h-3 rounded-full bg-[var(--color-brand-red)] border-[1.5px] border-black' />
            <div className='w-3 h-3 rounded-full bg-[var(--color-brand-yellow)] border-[1.5px] border-black' />
            <div className='w-3 h-3 rounded-full bg-[var(--color-brand-green)] border-[1.5px] border-black' />
            <span className='ml-auto mr-auto font-mono text-[12px] text-white/75'>forever-pto.com / planner</span>
          </div>
          <div className='p-[22px] bg-card'>
            <div className='grid grid-cols-2 gap-3.5 mb-4'>
              {[
                { label: t('hero.mockupFieldPto'), value: '22', unit: t('hero.mockupFieldPtoUnit') },
                { label: t('hero.mockupFieldCountry'), value: '🇪🇸 ES', unit: t('hero.mockupFieldHolidays') },
              ].map(({ label, value, unit }) => (
                <div
                  key={label}
                  className='border-[3px] border-[var(--frame)] rounded-[8px] px-3 py-2.5 bg-[var(--background)]'
                >
                  <div className='font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-1'>
                    {label}
                  </div>
                  <div className='font-display font-extrabold text-[28px] leading-none'>
                    {value}
                    <span className='text-[14px] font-semibold text-muted-foreground ml-1'>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className='px-[18px] pt-[18px] pb-4 bg-[var(--accent)] border-[4px] border-[var(--frame)] rounded-[10px]'>
              <div className='text-[12px] uppercase tracking-[0.1em] mb-1'>
                {t('hero.mockupLabel', { year: new Date().getFullYear() })}
              </div>
              <div className='font-display font-extrabold text-[56px] leading-none tracking-[-0.03em] flex items-baseline gap-2.5'>
                47
                <span className='text-[18px] font-semibold opacity-70'>{t('hero.mockupRatio')}</span>
              </div>
              <div className='mt-2 font-serif italic text-[18px]'>{t('hero.mockupQuote')}</div>
            </div>

            <div className='mt-4 grid grid-cols-7 gap-1'>
              {DAY_HEADERS.map((d) => (
                <div key={d} className='text-center font-mono text-[10px] font-bold py-1 text-muted-foreground'>
                  {d}
                </div>
              ))}
              {CAL_ENTRIES.map(({ id, type }) => (
                <div
                  key={id}
                  className={`${dayCell[type]} aspect-square grid place-items-center font-mono text-[11px] font-semibold`}
                >
                  {type === 'pto' ? '✈' : type === 'holiday' ? '★' : ''}
                </div>
              ))}
            </div>
            <div className='flex gap-3.5 mt-3 flex-wrap text-[11px]'>
              {(
                [
                  { type: 'pto' as DayType, label: t('hero.mockupLegendPto') },
                  { type: 'holiday' as DayType, label: t('hero.mockupLegendHoliday') },
                  { type: 'weekend' as DayType, label: t('hero.mockupLegendWeekend') },
                ] as const
              ).map(({ type, label }) => (
                <span key={label} className='inline-flex items-center gap-1.5'>
                  <span className={`${dayCell[type]} w-4 h-4 inline-block`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
