import { Link } from '@application/i18n/navigtion';
import { getTranslations } from 'next-intl/server';
import { version } from '../../../../../package.json';
import { ContactButton } from '../contact/ContactButton';
import { CookieButton } from './components/CookieButton';
import { DevFooter } from './components/DevFooter';

export const Footer = async () => {
  const t = await getTranslations('footer');

  return (
    <footer className='w-full bg-card border-t-[3px] border-[var(--frame)]'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center justify-between flex-wrap gap-3 px-6 pt-5 pb-4 border-b-[2px] border-[var(--frame)]/18'>
          <Link
            href='/'
            className='flex items-center gap-2 font-display font-extrabold text-[18px] tracking-[-0.02em] hover:opacity-80 transition-opacity'
          >
            <div
              className='w-[30px] h-[30px] bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[8px] shadow-[2px_2px_0_0_var(--frame)] grid place-items-center text-[16px] shrink-0'
              style={{ transform: 'rotate(-4deg)' }}
              aria-hidden='true'
            >
              🌴
            </div>
            <span>Forever PTO</span>
          </Link>
          <span className='font-mono text-[11px] text-muted-foreground'>
            {t('version', { version }).replace('●', '')}
            <span className='text-red-500 animate-pulse'>●</span>
          </span>
        </div>

        <DevFooter />
        <nav
          aria-label={t('legalNavigation')}
          className='flex flex-col sm:flex-row justify-center items-center gap-3 py-5 px-4 max-w-4xl mx-auto border-t-[2px] border-dashed border-[var(--frame)]/18'
        >
          <Link
            href='/planner'
            className='text-sm font-semibold px-1.5 py-0.5 border-[3px] border-transparent rounded-[8px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-accent-foreground transition-all duration-75'
          >
            {t('planner')}
          </Link>
          <Link
            href='/legal/privacy-policy'
            className='text-sm font-medium px-1.5 py-0.5 border-[3px] border-transparent rounded-[8px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-accent-foreground transition-all duration-75'
          >
            {t('privacyPolicy')}
          </Link>
          <Link
            href='/legal/terms-of-service'
            className='text-sm font-medium px-1.5 py-0.5 border-[3px] border-transparent rounded-[8px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-accent-foreground transition-all duration-75'
          >
            {t('termsOfService')}
          </Link>
          <Link
            href='/legal/cookie-policy'
            className='text-sm font-medium px-1.5 py-0.5 border-[3px] border-transparent rounded-[8px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-accent-foreground transition-all duration-75'
          >
            {t('cookiePolicy')}
          </Link>
          <Link
            href='/legal/legal-notice'
            className='text-sm font-medium px-1.5 py-0.5 border-[3px] border-transparent rounded-[8px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-accent-foreground transition-all duration-75'
          >
            {t('legalNotice')}
          </Link>
          <CookieButton />
          <ContactButton />
        </nav>

        <div className='px-6 py-3 border-t-[2px] border-dashed border-[var(--frame)]/18 flex justify-center'>
          <span className='font-mono text-[11px] text-muted-foreground text-center'>
            {t('copyright', { year: new Date().getFullYear() })}
          </span>
        </div>
      </div>
    </footer>
  );
};
