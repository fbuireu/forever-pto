import { Link } from '@application/i18n/navigtion';
import { Button } from '@ui/components/primitives/button';
import { MarketingLanguageSwitcher } from '@ui/modules/components/core/MarketingLanguageSwitcher';
import { ThemeSelector } from '@ui/modules/components/appSidebar/components/ThemeSelector';
import { getTranslations } from 'next-intl/server';

export const MarketingNav = async () => {
  const t = await getTranslations('landing');

  return (
    <nav className='sticky top-0 z-50 bg-[var(--background)] border-b-[4px] border-[var(--frame)]'>
      <div className='max-w-[1320px] mx-auto flex items-center justify-between px-7 py-[14px]'>
        <Link href='/' className='flex items-center gap-2.5 font-display font-extrabold text-[22px] tracking-[-0.02em] hover:opacity-85 transition-opacity'>
          <div
            className='w-[38px] h-[38px] bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] grid place-items-center text-[22px] shrink-0'
            style={{ transform: 'rotate(-4deg)' }}
            aria-hidden='true'
          >
            🌴
          </div>
          <span>Forever PTO</span>
        </Link>

        <div className='hidden md:flex gap-7 items-center font-semibold text-[15px]'>
          {([
            { href: '/#how', label: t('nav.how') },
            { href: '/#features', label: t('nav.features') },
            { href: '/#pricing', label: t('nav.pricing') },
          ]).map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className='px-2 py-1 border-[2px] border-transparent rounded-[6px] hover:bg-[var(--accent)] hover:border-[var(--frame)] transition-all duration-75'
            >
              {label}
            </a>
          ))}
        </div>

        <div className='flex gap-2.5 items-center'>
          <ThemeSelector buttonClassName='h-9 w-9 px-0 focus-visible:ring-1' />
          <MarketingLanguageSwitcher />
          <Button variant='accent' size='sm' asChild>
            <Link href='/planner'>{t('nav.cta')}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};
