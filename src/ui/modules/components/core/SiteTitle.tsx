import { getTranslations } from 'next-intl/server';

export const SiteTitle = async () => {
  const t = await getTranslations('home');

  return (
    <div className='flex items-center flex-col justify-center mt-8 gap-4'>
      <h1 className='font-display font-extrabold text-[clamp(42px,6vw,72px)] leading-none tracking-[-0.04em] text-center flex items-center gap-3 bg-[var(--surface-panel)] border-[3px] border-[var(--frame)] rounded-[12px] px-5 py-4 shadow-[var(--shadow-brutal-md)]'>
        <span
          className='w-[48px] h-[48px] bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] grid place-items-center text-[28px] shrink-0'
          style={{ transform: 'rotate(-4deg)' }}
          aria-hidden='true'
        >
          🌴
        </span>
        <span>Forever PTO</span>
      </h1>
      <p className='max-w-3xl rounded-[10px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel-soft)] px-5 py-3.5 text-center text-sm font-medium text-muted-foreground shadow-[var(--shadow-brutal-sm)] sm:text-base'>
        {t('subtitle')}
      </p>
    </div>
  );
};
