import { Link } from '@application/i18n/navigation';
import { Button } from '@ui/modules/core/primitives/Button';
import { ThemeSelector } from '@ui/modules/sidebar/components/ThemeSelector';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { HomepageLanguageSwitcher } from './HomepageLanguageSwitcher';

export const Navigation = async () => {
  const t = await getTranslations('homepage');

  return (
    <nav className='sticky top-0 z-50 bg-[var(--background)] border-b-[4px] border-[var(--frame)]'>
      <div className='max-w-[1320px] mx-auto flex items-center justify-between px-7 py-[14px]'>
        <Link
          href='/'
          className='flex items-center gap-2.5 font-display font-extrabold text-[22px] tracking-[-0.02em] hover:opacity-85 transition-opacity'
        >
          <div
            className='w-[38px] h-[38px] bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] overflow-hidden shrink-0'
            style={{ transform: 'rotate(-4deg)' }}
            aria-hidden
          >
            <Image src='/static/images/forever-pto-logo.png' alt='' width={38} height={38} unoptimized />
          </div>
          <span>Forever PTO</span>
        </Link>

        <div className='hidden md:flex gap-7 items-center font-semibold text-[15px]'>
          {[
            { href: '/#how', label: t('nav.how') },
            { href: '/#features', label: t('nav.features') },
            { href: '/#pricing', label: t('nav.pricing') },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className='px-2 py-1 border-[3px] border-transparent rounded-[8px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-accent-foreground transition-[background-color,border-color,color] duration-75'
            >
              {label}
            </Link>
          ))}
        </div>

        <div className='flex gap-2.5 items-center'>
          <ThemeSelector buttonClassName='h-9 w-9 px-0 focus-visible:ring-1' />
          <HomepageLanguageSwitcher />
          <Button variant='accent' size='sm' asChild>
            <Link href='/planner'>{t('nav.trialAction')}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};
