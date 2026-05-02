import { Link } from '@application/i18n/navigtion';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  const suggestLinks = [
    { href: '/#how', emoji: '⚡', bg: 'bg-[var(--color-brand-teal)]', label: t('link1') },
    { href: '/#features', emoji: '🌴', bg: 'bg-[var(--accent)]', label: t('link2') },
    { href: '/#pricing', emoji: '€', bg: 'bg-[var(--color-brand-orange)]', color: 'text-white', label: t('link3') },
    { href: '/#faq', emoji: '?', bg: 'bg-[var(--color-brand-pink)]', label: t('link4') },
  ] as const;

  return (
    <div className='min-h-screen flex flex-col bg-background text-foreground'>
      <header className='flex items-center justify-between px-10 py-[22px] border-b-[3px] border-[var(--frame)]'>
        <Link
          href='/'
          className='inline-flex items-center gap-2.5 font-display font-extrabold text-[20px] tracking-[-0.02em] no-underline text-foreground'
        >
          <span className='w-[38px] h-[38px] bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] grid place-items-center -rotate-[5deg]'>
            <svg viewBox='0 0 32 32' width='22' height='22' aria-hidden='true'>
              <path d='M16 28 Q14 18 17 8' stroke='#0E0E0E' strokeWidth='2.4' fill='none' strokeLinecap='round' />
              <path d='M17 8 Q8 3 2 6 Q10 5 15 10' fill='#4ECDC4' stroke='#0E0E0E' strokeWidth='1.8' />
              <path d='M17 8 Q25 3 31 6 Q23 5 18 10' fill='#4ECDC4' stroke='#0E0E0E' strokeWidth='1.8' />
              <circle cx='25' cy='4' r='2.8' fill='#FF7A45' stroke='#0E0E0E' strokeWidth='1.5' />
            </svg>
          </span>
          Forever <em className='font-serif italic font-normal'>PTO</em>
        </Link>
        <nav className='hidden md:flex gap-6 font-mono text-[12px] font-bold tracking-[0.08em] uppercase'>
          <Link
            href='/#how'
            className='text-foreground no-underline border-b-2 border-transparent hover:border-[var(--frame)] pb-0.5 transition-colors'
          >
            {t('link1')}
          </Link>
          <Link
            href='/#features'
            className='text-foreground no-underline border-b-2 border-transparent hover:border-[var(--frame)] pb-0.5 transition-colors'
          >
            {t('link2')}
          </Link>
          <Link
            href='/#pricing'
            className='text-foreground no-underline border-b-2 border-transparent hover:border-[var(--frame)] pb-0.5 transition-colors'
          >
            {t('link3')}
          </Link>
          <Link
            href='/#faq'
            className='text-foreground no-underline border-b-2 border-transparent hover:border-[var(--frame)] pb-0.5 transition-colors'
          >
            {t('link4')}
          </Link>
        </nav>
      </header>

      <div className='flex-1 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-[60px] px-10 md:px-20 py-[60px] items-center'>
        <div className='flex items-start justify-center'>
          <div
            className='flex items-start gap-[10px] font-display font-extrabold tracking-[-0.06em] leading-[0.82]'
            style={{ fontSize: 'clamp(120px, 18vw, 280px)' }}
          >
            <span className='inline-block bg-[var(--accent)] border-[5px] border-[var(--frame)] rounded-[18px] px-[0.2em] pb-[0.17em] pt-[0.03em] shadow-[10px_10px_0_0_var(--frame)] leading-[0.85]'>
              4
            </span>
            <span className='inline-block bg-[var(--color-brand-teal)] border-[5px] border-[var(--frame)] rounded-[18px] px-[0.2em] pb-[0.17em] pt-[0.03em] shadow-[10px_10px_0_0_var(--frame)] leading-[0.85] relative'>
              0
              <svg
                viewBox='0 0 80 80'
                style={{ width: '58%', height: '58%', position: 'absolute', top: '22%', left: '22%' }}
                aria-hidden='true'
              >
                <path d='M40 72 Q36 50 42 20' stroke='#0E0E0E' strokeWidth='4' fill='none' strokeLinecap='round' />
                <path d='M42 20 Q24 8 6 10 Q22 14 38 24' fill='#A6E368' stroke='#0E0E0E' strokeWidth='3' />
                <path d='M42 20 Q60 8 78 10 Q62 14 46 24' fill='#A6E368' stroke='#0E0E0E' strokeWidth='3' />
                <path d='M42 20 Q32 4 26 -2 Q38 6 44 20' fill='#A6E368' stroke='#0E0E0E' strokeWidth='3' />
                <path d='M42 20 Q52 4 58 -2 Q46 6 40 20' fill='#A6E368' stroke='#0E0E0E' strokeWidth='3' />
                <circle cx='62' cy='6' r='5' fill='#FF7A45' stroke='#0E0E0E' strokeWidth='2' />
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

          <h1
            className='font-display font-extrabold leading-none tracking-[-0.035em] mb-[18px] text-wrap-pretty'
            style={{ fontSize: 'clamp(34px, 4.4vw, 56px)' }}
          >
            {t('title')}{' '}
            <span
              className='inline-block bg-[var(--accent)] px-2 border-[3px] border-[var(--frame)] rounded-[6px] mx-0.5'
              style={{ transform: 'rotate(-1.5deg)' }}
            >
              {t('titleHighlight')}
            </span>{' '}
            <em className='font-serif italic font-normal'>{t('titleEmphasis')}</em>
          </h1>

          <p className='text-[18px] leading-[1.55] text-muted-foreground max-w-[46ch] mb-8'>{t('lede')}</p>

          <div className='flex flex-wrap gap-[14px] mb-9'>
            <Link
              href='/'
              className='inline-flex items-center gap-2 px-[22px] py-[14px] font-sans font-bold text-[15px] tracking-[-0.01em] border-[3px] border-[var(--frame)] rounded-[10px] no-underline bg-[var(--frame)] text-[var(--accent)] shadow-[5px_5px_0_0_var(--frame)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--frame)]'
            >
              ← {t('ctaPrimary')}
            </Link>
            <Link
              href='/planner'
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

      <footer className='border-t-[3px] border-[var(--frame)] px-10 py-[18px] flex flex-col md:flex-row justify-between gap-1.5 font-mono text-[11px] text-muted-foreground tracking-[0.06em] uppercase bg-card'>
        <span>Forever PTO · {new Date().getFullYear()}</span>
        <span>{t('footerStatus')}</span>
      </footer>
    </div>
  );
}
