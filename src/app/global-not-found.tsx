import '@styles/index.css';

import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';

const LOCALES = ['en', 'es', 'ca', 'it', 'fr', 'de'] as const;
type Locale = (typeof LOCALES)[number];

async function detectLocale(): Promise<Locale> {
  const [headersList, cookieStore] = await Promise.all([headers(), cookies()]);

  const intlLocale = headersList.get('x-next-intl-locale');
  if (intlLocale && (LOCALES as readonly string[]).includes(intlLocale)) {
    return intlLocale as Locale;
  }

  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }

  const acceptLang = headersList.get('accept-language') ?? '';
  for (const tag of acceptLang.split(',')) {
    const lang = tag.split(';')[0].trim().split('-')[0].toLowerCase();
    if ((LOCALES as readonly string[]).includes(lang)) return lang as Locale;
  }

  return 'en';
}

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export default async function GlobalNotFound() {
  const locale = await detectLocale();
  const t = await getTranslations({ locale, namespace: 'notFound' });

  const suggestLinks = [
    { href: `/${locale}/#how`, emoji: '⚡', bg: 'bg-[var(--color-brand-teal)]', label: t('link1') },
    { href: `/${locale}/#features`, emoji: '🌴', bg: 'bg-[var(--accent)]', label: t('link2') },
    { href: `/${locale}/#pricing`, emoji: '€', bg: 'bg-[var(--color-brand-orange)]', label: t('link3') },
    { href: `/${locale}/#faq`, emoji: '?', bg: 'bg-[var(--color-brand-pink)]', label: t('link4') },
  ] as const;

  return (
    <html
      lang={locale}
      className={`${bricolage.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className='font-sans antialiased'>
        <div className='min-h-screen flex flex-col bg-background text-foreground'>
          <header className='border-b-[3px] border-[var(--frame)]'>
            <div className='max-w-[1320px] mx-auto flex items-center justify-between px-7 py-[22px]'>
              <a
                href={`/${locale}`}
                className='inline-flex items-center gap-2.5 font-display font-extrabold text-[20px] tracking-[-0.02em] no-underline text-foreground'
              >
                <span className='w-[38px] h-[38px] bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] grid place-items-center -rotate-[5deg]'>
                  <svg viewBox='0 0 32 32' width='22' height='22' aria-hidden='true'>
                    <path
                      d='M16 28 Q14 18 17 8'
                      stroke='var(--color-brand-ink)'
                      strokeWidth='2.4'
                      fill='none'
                      strokeLinecap='round'
                    />
                    <path
                      d='M17 8 Q8 3 2 6 Q10 5 15 10'
                      fill='var(--color-brand-teal)'
                      stroke='var(--color-brand-ink)'
                      strokeWidth='1.8'
                    />
                    <path
                      d='M17 8 Q25 3 31 6 Q23 5 18 10'
                      fill='var(--color-brand-teal)'
                      stroke='var(--color-brand-ink)'
                      strokeWidth='1.8'
                    />
                    <circle
                      cx='25'
                      cy='4'
                      r='2.8'
                      fill='var(--color-brand-orange)'
                      stroke='var(--color-brand-ink)'
                      strokeWidth='1.5'
                    />
                  </svg>
                </span>
                Forever <em className='font-serif italic font-normal'>PTO</em>
              </a>
              <nav className='hidden md:flex gap-6 font-mono text-[12px] font-bold tracking-[0.08em] uppercase'>
                <a href={`/${locale}/#how`} className='text-foreground no-underline border-b-2 border-transparent hover:border-[var(--frame)] pb-0.5 transition-colors'>{t('link1')}</a>
                <a href={`/${locale}/#features`} className='text-foreground no-underline border-b-2 border-transparent hover:border-[var(--frame)] pb-0.5 transition-colors'>{t('link2')}</a>
                <a href={`/${locale}/#pricing`} className='text-foreground no-underline border-b-2 border-transparent hover:border-[var(--frame)] pb-0.5 transition-colors'>{t('link3')}</a>
                <a href={`/${locale}/#faq`} className='text-foreground no-underline border-b-2 border-transparent hover:border-[var(--frame)] pb-0.5 transition-colors'>{t('link4')}</a>
              </nav>
            </div>
          </header>

          <div className='flex-1 py-[60px]'>
            <div className='max-w-[1320px] mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-[60px] px-7 items-center'>
              <div className='flex items-start justify-center'>
                <div className='flex items-start gap-[10px] font-display font-extrabold tracking-[-0.06em] leading-[0.82] text-[clamp(120px,18vw,280px)]'>
                  <span className='inline-block bg-[var(--accent)] border-[5px] border-[var(--frame)] rounded-[18px] px-[0.2em] pb-[0.17em] pt-[0.03em] shadow-[10px_10px_0_0_var(--frame)] leading-[0.85]'>
                    4
                  </span>
                  <span className='inline-block bg-[var(--color-brand-teal)] border-[5px] border-[var(--frame)] rounded-[18px] px-[0.2em] pb-[0.17em] pt-[0.03em] shadow-[10px_10px_0_0_var(--frame)] leading-[0.85] relative'>
                    0
                    <svg viewBox='0 0 80 80' className='w-[58%] h-[58%] absolute top-[22%] left-[22%]' aria-hidden='true'>
                      <path d='M40 72 Q36 50 42 20' stroke='var(--color-brand-ink)' strokeWidth='4' fill='none' strokeLinecap='round' />
                      <path d='M42 20 Q24 8 6 10 Q22 14 38 24' fill='var(--color-brand-green)' stroke='var(--color-brand-ink)' strokeWidth='3' />
                      <path d='M42 20 Q60 8 78 10 Q62 14 46 24' fill='var(--color-brand-green)' stroke='var(--color-brand-ink)' strokeWidth='3' />
                      <path d='M42 20 Q32 4 26 -2 Q38 6 44 20' fill='var(--color-brand-green)' stroke='var(--color-brand-ink)' strokeWidth='3' />
                      <path d='M42 20 Q52 4 58 -2 Q46 6 40 20' fill='var(--color-brand-green)' stroke='var(--color-brand-ink)' strokeWidth='3' />
                      <circle cx='62' cy='6' r='5' fill='var(--color-brand-orange)' stroke='var(--color-brand-ink)' strokeWidth='2' />
                    </svg>
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
                  <a
                    href={`/${locale}`}
                    className='inline-flex items-center gap-2 px-[22px] py-[14px] font-sans font-bold text-[15px] tracking-[-0.01em] border-[3px] border-[var(--frame)] rounded-[10px] no-underline bg-[var(--frame)] text-[var(--accent)] shadow-[5px_5px_0_0_var(--frame)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--frame)]'
                  >
                    ← {t('ctaPrimary')}
                  </a>
                  <a
                    href={`/${locale}/planner`}
                    className='inline-flex items-center gap-2 px-[22px] py-[14px] font-sans font-bold text-[15px] tracking-[-0.01em] border-[3px] border-[var(--frame)] rounded-[10px] no-underline bg-card text-foreground shadow-[5px_5px_0_0_var(--frame)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--frame)]'
                  >
                    {t('ctaPlanner')} →
                  </a>
                </div>

                <div className='border-t-2 border-dashed border-[var(--frame)] pt-[22px] grid grid-cols-2 gap-[10px] max-w-[520px]'>
                  <span className='col-span-2 font-mono text-[11px] font-bold text-muted-foreground tracking-[0.12em] uppercase mb-1'>
                    {t('suggestLabel')}
                  </span>
                  {suggestLinks.map(({ href, emoji, bg, label }) => (
                    <a
                      key={href}
                      href={href}
                      className='flex items-center gap-2.5 px-3 py-2.5 bg-card border-[2px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] no-underline text-foreground text-[13px] font-semibold transition-[transform,box-shadow] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--frame)]'
                    >
                      <span className={`shrink-0 w-6 h-6 ${bg} text-[var(--color-brand-ink)] border-[2px] border-[var(--frame)] rounded-[6px] grid place-items-center text-[13px] font-extrabold`}>
                        {emoji}
                      </span>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <footer className='border-t-[3px] border-[var(--frame)] px-10 py-[18px] flex flex-col md:flex-row justify-between gap-1.5 font-mono text-[11px] text-muted-foreground tracking-[0.06em] uppercase bg-card'>
            <span>Forever PTO · {new Date().getFullYear()}</span>
            <span>{t('footerStatus')}</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
