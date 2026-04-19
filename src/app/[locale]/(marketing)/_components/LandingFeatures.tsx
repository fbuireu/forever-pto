import { Badge } from '@ui/components/primitives/badge';
import { getTranslations } from 'next-intl/server';
import { brutCard, type DayType, dayCell } from './landing-shared';

export const LandingFeatures = async () => {
  const t = await getTranslations('landing');

  return (
    <section className='px-7 py-24' id='features'>
      <div className='max-w-[900px] mx-auto mb-14 text-center'>
        <div className='flex justify-center mb-4'>
          <Badge variant='outline'>{t('features.badge')}</Badge>
        </div>
        <h2 className='font-display font-extrabold leading-none tracking-[-0.03em] mb-4 text-[clamp(36px,5vw,64px)]'>
          {t('features.h2Start')} <em className='font-serif italic font-semibold'>{t('features.h2Em')}</em>{' '}
          {t('features.h2End')}
        </h2>
        <p className='text-[19px] text-muted-foreground'>{t('features.p')}</p>
      </div>

      <div className='max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-6 gap-6'>
        {/* Big bridge feature */}
        <div
          className={`${brutCard} md:col-span-4 p-7 bg-[var(--accent)] transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--frame)]`}
        >
          <span className='inline-block px-2.5 py-1 bg-[var(--surface-panel)] border-[3px] border-[var(--frame)] rounded-[6px] text-[12px] font-semibold shadow-[var(--shadow-brutal-xs)]'>
            {t('features.bridgeTag')}
          </span>
          <h3 className='font-display font-extrabold text-[26px] mt-3.5 mb-2 tracking-[-0.02em]'>
            {t('features.bridgeH3')}
          </h3>
          <p className='text-foreground text-[15px] leading-relaxed mb-4'>{t('features.bridgeP')}</p>
          <div className='grid grid-cols-7 gap-1 max-w-[280px]'>
            {(['weekend', 'pto', 'holiday', 'work', 'work', 'work', 'work'] as DayType[]).map((dt, i) => {
              const label = ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i];
              return (
                <div
                  key={label}
                  className={`${dayCell[dt]} aspect-square grid place-items-center text-[12px] font-bold`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ratio max */}
        <div
          className={`${brutCard} md:col-span-2 p-7 transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--frame)]`}
        >
          <span className='inline-block px-2.5 py-1 bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[6px] text-[12px] font-semibold shadow-[var(--shadow-brutal-xs)]'>
            {t('features.ratioTag')}
          </span>
          <div className='font-display font-extrabold text-[100px] leading-none tracking-[-0.05em] mt-2.5 mb-2'>
            3.5<span className='text-[32px]'>×</span>
          </div>
          <p className='text-foreground text-[15px]'>{t('features.ratioP')}</p>
        </div>

        {/* Calendar sync */}
        <div
          className={`${brutCard} md:col-span-2 p-7 transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--frame)]`}
          style={{ background: 'var(--color-brand-teal)' }}
        >
          <span className='inline-block px-2.5 py-1 bg-[var(--surface-panel)] border-[3px] border-[var(--frame)] rounded-[6px] text-[12px] font-semibold shadow-[var(--shadow-brutal-xs)]'>
            {t('features.syncTag')}
          </span>
          <h3 className='font-display font-extrabold text-[26px] mt-3.5 mb-2 tracking-[-0.02em]'>
            {t('features.syncH3')}
          </h3>
          <p className='text-[15px] leading-relaxed'>{t('features.syncP')}</p>
          <div className='flex flex-wrap gap-2 mt-3.5'>
            {['📅 Google', '📨 Outlook', '🍎 Apple'].map((s) => (
              <span
                key={s}
                className='bg-[var(--surface-panel)] border-[3px] border-[var(--frame)] rounded-[8px] px-3 py-1.5 font-semibold text-[13px] shadow-[var(--shadow-brutal-xs)]'
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Anti-conflicts */}
        <div
          className={`${brutCard} md:col-span-2 p-7 transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--frame)]`}
        >
          <span className='inline-block px-2.5 py-1 bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[6px] text-[12px] font-semibold shadow-[var(--shadow-brutal-xs)]'>
            {t('features.conflictsTag')}
          </span>
          <h3 className='font-display font-extrabold text-[26px] mt-3.5 mb-2 tracking-[-0.02em]'>
            {t('features.conflictsH3')}
          </h3>
          <div className='flex flex-wrap gap-1.5 mb-3.5'>
            {[
              { text: 'All-hands trim.', alert: false },
              { text: 'Q3 closing', alert: true },
              { text: 'Lanzamiento', alert: false },
            ].map(({ text, alert }) => (
              <span
                key={text}
                className='border-[2.5px] border-[var(--frame)] rounded-[6px] px-2 py-1 font-mono text-[12px] font-semibold'
                style={{
                  background: alert ? 'var(--color-brand-red)' : 'var(--background)',
                  color: alert ? 'white' : 'inherit',
                }}
              >
                {text}
              </span>
            ))}
          </div>
          <p className='text-foreground text-[15px]'>{t('features.conflictsP')}</p>
        </div>

        {/* Countries */}
        <div
          className={`${brutCard} md:col-span-2 p-7 transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--frame)]`}
          style={{ background: 'var(--color-brand-orange)' }}
        >
          <span className='inline-block px-2.5 py-1 bg-[var(--surface-panel)] border-[3px] border-[var(--frame)] rounded-[6px] font-mono text-[12px] font-semibold text-[var(--frame)] shadow-[var(--shadow-brutal-xs)]'>
            {t('features.countriesTag')}
          </span>
          <h3 className='font-display font-extrabold text-[26px] mt-3.5 mb-2 tracking-[-0.02em] text-white'>
            {t('features.countriesH3')}
          </h3>
          <p className='text-white/90 text-[15px] leading-relaxed mb-3'>{t('features.countriesP')}</p>
          <div className='flex flex-wrap gap-2'>
            {['🇪🇸', '🇮🇹', '🇩🇪', '🇫🇷', '🇬🇧', '🇺🇸', '+8'].map((flag) => (
              <span
                key={flag}
                className='bg-[var(--surface-panel)] border-[3px] border-[var(--frame)] rounded-[8px] px-2.5 py-1.5 text-[13px] font-semibold shadow-[var(--shadow-brutal-xs)]'
              >
                {flag}
              </span>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div
          className={`${brutCard} md:col-span-6 p-7 transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--frame)]`}
          style={{ background: 'var(--frame)', color: 'var(--background)' }}
        >
          <span className='inline-block px-2.5 py-1 bg-[var(--accent)] border-[2.5px] border-[var(--background)] rounded-[6px] font-mono text-[12px] font-semibold text-[var(--frame)] shadow-[2px_2px_0_0_var(--background)]'>
            {t('features.privacyTag')}
          </span>
          <h3 className='font-display font-extrabold text-[26px] mt-3.5 mb-2 tracking-[-0.02em] text-[var(--background)]'>
            {t('features.privacyH3')}
          </h3>
          <p className='text-[var(--background)]/85 text-[15px] leading-relaxed max-w-[700px]'>
            {t('features.privacyP')}
          </p>
        </div>
      </div>
    </section>
  );
};
