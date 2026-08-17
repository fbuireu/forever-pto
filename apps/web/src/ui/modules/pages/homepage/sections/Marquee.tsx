import { getTranslations } from 'next-intl/server';

export const Marquee = async () => {
  const t = await getTranslations('homepage');

  return (
    <div
      className='bg-[var(--frame)] text-[var(--background)] border-y-[4px] border-[var(--frame)] overflow-hidden py-3.5'
      aria-hidden='true'
    >
      <div className='flex w-max whitespace-nowrap font-display font-bold text-[22px] uppercase tracking-[0.06em] will-change-transform [--marquee-duration:20s] md:[--marquee-duration:30s] animate-[marquee_var(--marquee-duration)_linear_infinite]'>
        {[0, 1].flatMap((rep) =>
          t('marquee.items')
            .split(' · ')
            .map((text) => (
              <span key={`${rep}-${text}`} className='inline-flex items-center gap-3.5 pr-10'>
                {text}
                <span className='text-[var(--accent)] text-sm'>★</span>
              </span>
            ))
        )}
      </div>
    </div>
  );
};
