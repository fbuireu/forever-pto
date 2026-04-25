import { getTranslations } from 'next-intl/server';

export const Stats = async () => {
  const t = await getTranslations('landing');

  return (
    <section className='px-7 pb-24'>
      <div className='max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4 border-[4px] border-[var(--frame)] rounded-[14px] overflow-hidden bg-card shadow-[10px_10px_0_0_var(--frame)]'>
        {[
          { num: '2.14×', label: t('stats.multiplierLabel'), bg: 'var(--color-brand-yellow)' },
          { num: '47', label: t('stats.daysLabel'), bg: 'var(--color-brand-teal)' },
          { num: '14', label: t('stats.countriesLabel'), bg: 'var(--color-brand-orange)' },
          { num: '12k+', label: t('stats.plansLabel'), bg: 'var(--color-brand-purple)' },
        ].map(({ num, label, bg }) => (
          <div
            key={num}
            className='px-6 py-8 border-r-[4px] border-[var(--frame)] last:border-r-0'
            style={{ background: bg }}
          >
            <div className='font-display font-extrabold text-[56px] leading-none tracking-[-0.04em] mb-1.5'>{num}</div>
            <div className='text-[13px] font-semibold'>{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
