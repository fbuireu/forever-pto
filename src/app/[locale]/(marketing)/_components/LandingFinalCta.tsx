import { Link } from '@application/i18n/navigtion';
import { Button } from '@ui/components/primitives/button';
import { getTranslations } from 'next-intl/server';

export const LandingFinalCta = async () => {
  const t = await getTranslations('landing');

  return (
    <section className='px-7 py-24 bg-[var(--frame)] text-[var(--background)] border-t-[4px] border-[var(--frame)] relative overflow-hidden'>
      {/* Decorative shapes */}
      <div
        className='hidden md:block absolute w-20 h-20 top-14 left-[8%] bg-[var(--color-brand-yellow)] border-[4px] border-[var(--background)] rounded-[12px] shadow-[6px_6px_0_0_var(--background)] rotate-[-12deg]'
        aria-hidden='true'
      />
      <div
        className='hidden md:block absolute w-14 h-14 bottom-20 left-[14%] bg-[var(--color-brand-teal)] border-[4px] border-[var(--background)] rounded-full shadow-[6px_6px_0_0_var(--background)] rotate-[15deg]'
        aria-hidden='true'
      />
      <div
        className='hidden md:block absolute w-[70px] h-[70px] top-24 right-[10%] bg-[var(--color-brand-orange)] border-[4px] border-[var(--background)] rounded-[12px] shadow-[6px_6px_0_0_var(--background)] rotate-[8deg]'
        aria-hidden='true'
      />
      <div
        className='hidden md:block absolute w-24 h-14 bottom-16 right-[7%] bg-[var(--color-brand-purple)] border-[4px] border-[var(--background)] rounded-[12px] shadow-[6px_6px_0_0_var(--background)] rotate-[-6deg]'
        aria-hidden='true'
      />

      <div className='max-w-[900px] mx-auto text-center relative z-[2]'>
        <h2 className='font-display font-extrabold leading-none tracking-[-0.03em] mb-5 text-[clamp(40px,6vw,80px)]'>
          {t('finalCta.h2Start')} <em className='font-serif italic text-[var(--accent)]'>{t('finalCta.h2Em')}</em>
          <br />
          {t('finalCta.h2End')}
        </h2>
        <p className='text-[19px] opacity-85 mb-8'>{t('finalCta.p')}</p>
        <Button variant='accent' size='lg' asChild>
          <Link href='/planner'>{t('finalCta.cta')}</Link>
        </Button>
      </div>
    </section>
  );
};
