import { getTranslations } from 'next-intl/server';

export const LandingMarquee = async () => {
  const t = await getTranslations('landing');

  return (
    <div className='bg-[var(--frame)] text-[var(--background)] border-y-[4px] border-[var(--frame)] overflow-hidden py-3.5' aria-hidden='true'>
      <div
        className='flex gap-10 whitespace-nowrap font-display font-bold text-[22px] tracking-[-0.01em]'
        style={{ animation: 'marquee 30s linear infinite' }}
      >
        {Array.from({ length: 2 }).map((_, rep) =>
          t('marquee.items').split(' · ').map((text) => (
            <span key={`${rep}-${text}`} className='inline-flex items-center gap-3.5'>
              {text}
              <span className='text-[var(--accent)] text-sm'>★</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
};
