import { Badge } from '@ui/modules/core/primitives/Badge';
import { getTranslations } from 'next-intl/server';
import { brutCard } from './shared';

export const Comparison = async () => {
  const t = await getTranslations('homepage');

  return (
    <section className='px-7 py-24 bg-[var(--surface-panel-alt)] border-y-[4px] border-[var(--frame)]' id='compare'>
      <div className='max-w-[900px] mx-auto mb-14 text-center'>
        <div className='flex justify-center mb-4'>
          <Badge variant='outline'>{t('comparison.badge')}</Badge>
        </div>
        <h2 className='font-display font-extrabold leading-none tracking-[-0.03em] text-[clamp(36px,5vw,64px)]'>
          {t('comparison.title')}
        </h2>
      </div>

      <div className='max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_60px_1fr] items-stretch gap-0'>
        <div className={`${brutCard} p-7 rotate-[-1deg]`}>
          <h3 className='font-display font-extrabold text-[22px] mb-4'>{t('comparison.withoutTitle')}</h3>
          <ul className='list-none'>
            {Array.from({ length: 5 }, (_, i) => t(`comparison.withoutItems.${i}` as Parameters<typeof t>[0])).map(
              (item) => (
                <li
                  key={item}
                  className='flex gap-2.5 items-start py-2.5 border-b-[2px] border-dashed border-black/15 last:border-b-0 text-[15px]'
                >
                  <span className='font-black text-muted-foreground w-[22px] text-center shrink-0'>✗</span>
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
        <div className='grid place-items-center'>
          <div className='w-16 h-16 rounded-full bg-[var(--accent)] border-[4px] border-[var(--frame)] shadow-[4px_4px_0_0_var(--frame)] grid place-items-center font-display font-extrabold text-[18px] rotate-[-8deg]'>
            VS
          </div>
        </div>
        <div className={`${brutCard} p-7 rotate-[1deg]`} style={{ background: 'var(--color-brand-green)' }}>
          <h3 className='font-display font-extrabold text-[22px] mb-4'>{t('comparison.withTitle')}</h3>
          <ul className='list-none'>
            {Array.from({ length: 5 }, (_, i) => t(`comparison.withItems.${i}` as Parameters<typeof t>[0])).map(
              (item) => (
                <li
                  key={item}
                  className='flex gap-2.5 items-start py-2.5 border-b-[2px] border-dashed border-black/15 last:border-b-0 text-[15px]'
                >
                  <span className='font-black w-[22px] text-center shrink-0'>✓</span>
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};
