import { Navigation } from '@ui/modules/pages/homepage/navigation/Navigation';
import { Footer } from '@ui/modules/shared/footer/Footer';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

interface NotFoundContentProps {
  locale: string;
}

export const NotFoundContent = async ({ locale }: NotFoundContentProps) => {
  const t = await getTranslations({ locale, namespace: 'notFound' });

  const suggestLinks = [
    { href: `/${locale}/#how`, emoji: '⚡', bg: 'bg-[var(--color-brand-teal)]', label: t('link1') },
    { href: `/${locale}/#features`, emoji: '🌴', bg: 'bg-[var(--accent)]', label: t('link2') },
    { href: `/${locale}/#pricing`, emoji: '€', bg: 'bg-[var(--color-brand-orange)]', label: t('link3') },
    { href: `/${locale}/#faq`, emoji: '?', bg: 'bg-[var(--color-brand-pink)]', label: t('link4') },
  ] as const;

  return (
    <div className='min-h-screen flex flex-col bg-background text-foreground'>
      <Navigation />

      <main id='main-content' className='flex-1 py-[60px]'>
        <div className='max-w-[1320px] mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-[60px] px-7 items-center'>
          <div className='flex items-start justify-center'>
            <div className='flex items-start gap-[10px] font-display font-extrabold tracking-[-0.06em] leading-[0.82] text-[clamp(120px,18vw,280px)]'>
              <span className='inline-block bg-[var(--accent)] border-[5px] border-[var(--frame)] rounded-[18px] px-[0.2em] pb-[0.17em] pt-[0.03em] shadow-[10px_10px_0_0_var(--frame)] leading-[0.85]'>
                4
              </span>
              <span className='inline-block bg-[var(--color-brand-teal)] border-[5px] border-[var(--frame)] rounded-[18px] px-[0.2em] pb-[0.17em] pt-[0.03em] shadow-[10px_10px_0_0_var(--frame)] leading-[0.85]'>
                0
              </span>
              <span className='inline-block bg-[var(--color-brand-orange)] text-white border-[5px] border-[var(--frame)] rounded-[18px] px-[0.2em] pb-[0.17em] pt-[0.03em] shadow-[10px_10px_0_0_var(--frame)] leading-[0.85]'>
                4
              </span>
            </div>
          </div>

          <div className='flex flex-col'>
            <span className='inline-flex items-center gap-2 self-start bg-[var(--frame)] text-[var(--accent)] px-3 py-1.5 rounded-[6px] font-mono text-[11px] font-bold tracking-[0.12em] uppercase mb-[22px]'>
              <span className='w-2 h-2 rounded-full bg-[var(--color-brand-orange)]' />
              {t('kicker')}
            </span>

            <h1 className='font-display font-extrabold leading-none tracking-[-0.035em] mb-[18px] text-wrap-pretty text-[clamp(34px,4.4vw,56px)]'>
              {t('title')}{' '}
              <span className='inline-block bg-[var(--accent)] px-2 border-[3px] border-[var(--frame)] rounded-[6px] mx-0.5 rotate-[-1.5deg]'>
                {t('titleHighlight')}
              </span>{' '}
              <em className='font-serif italic font-normal'>{t('titleEmphasis')}</em>
            </h1>

            <p className='text-[18px] leading-[1.55] text-muted-foreground max-w-[46ch] mb-8'>{t('lede')}</p>

            <div className='flex flex-wrap gap-[14px] mb-9'>
              <Link
                href={`/${locale}`}
                className='inline-flex items-center gap-2 px-[22px] py-[14px] font-sans font-bold text-[15px] tracking-[-0.01em] border-[3px] border-[var(--frame)] rounded-[10px] no-underline bg-[var(--frame)] text-[var(--accent)] shadow-[5px_5px_0_0_var(--frame)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--frame)]'
              >
                ← {t('ctaPrimary')}
              </Link>
              <Link
                href={`/${locale}/planner`}
                className='inline-flex items-center gap-2 px-[22px] py-[14px] font-sans font-bold text-[15px] tracking-[-0.01em] border-[3px] border-[var(--frame)] rounded-[10px] no-underline bg-card text-foreground shadow-[5px_5px_0_0_var(--frame)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--frame)]'
              >
                {t('ctaPlanner')} →
              </Link>
            </div>

            <div className='border-t-2 border-dashed border-[var(--frame)] pt-[22px] grid grid-cols-2 gap-[10px] max-w-[520px]'>
              <span className='col-span-2 font-mono text-[11px] font-bold text-muted-foreground tracking-[0.12em] uppercase mb-1'>
                {t('suggestLabel')}
              </span>
              {suggestLinks.map(({ href, emoji, bg, label }) => (
                <Link
                  key={href}
                  href={href}
                  className='flex items-center gap-2.5 px-3 py-2.5 bg-card border-[2px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] no-underline text-foreground text-[13px] font-semibold transition-[transform,box-shadow] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--frame)]'
                >
                  <span
                    className={`shrink-0 w-6 h-6 ${bg} text-[var(--color-brand-ink)] border-[2px] border-[var(--frame)] rounded-[6px] grid place-items-center text-[13px] font-extrabold`}
                  >
                    {emoji}
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
