import { Link } from '@application/i18n/navigtion';
import { CookieButton } from './components/CookieButton';
import { DevFooter } from './components/DevFooter';
import { ContactButton } from '../contact/ContactButton';

export const Footer = () => (
  <footer className='mt-8 w-full border-t m-auto flex justify-center'>
    <section className='max-w-4xl w-full'>
      <DevFooter />
      <div className='flex flex-col sm:flex-row justify-center items-center gap-4 py-6 px-4 max-w-4xl mx-auto'>
        <Link href='/privacy-policy' className='text-sm text-muted-foreground hover:underline'>
          Privacy Policy
        </Link>
        <Link href='/terms-of-service' className='text-sm text-muted-foreground hover:underline'>
          Terms of Service
        </Link>
                <CookieButton />
                  <ContactButton />
      </div>
    </section>
  </footer>
);
