import { isPremium as isPremiumFn } from '@application/actions/premium';
import { DEFAULT_QUERY_PARAMS } from '@const/const';
import type { SearchParams } from '@const/types';
import { getCountry } from '@infrastructure/services/country/getCountry/getCountry';
import { getHolidays } from '@infrastructure/services/holiday/getHolidays';
import { getRegion } from '@infrastructure/services/region/getRegion/getRegion';
import { SidebarTrigger } from '@modules/components/core/sidebar/atoms/sidebarTrigger/SidebarTrigger';
import { SidebarProvider } from '@modules/components/core/sidebar/provider/SidebarProvider/SidebarProvider';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { generateMetadata } from './metadata';

export const runtime = 'edge';

export interface ForeverPtoProps {
  searchParams: Promise<SearchParams>;
  params: Promise<{ locale: Locale }>;
}

const ForeverPto = async ({ searchParams, params }: ForeverPtoProps) => {
  const { locale } = await params;
  const { YEAR, PTO_DAYS, ALLOW_PAST_DAYS, CARRY_OVER_MONTHS } = DEFAULT_QUERY_PARAMS;
  const t = await getTranslations({ locale, namespace: 'home' });
  const {
    country,
    region,
    year = YEAR,
    ptoDays = PTO_DAYS,
    allowPastDays = ALLOW_PAST_DAYS,
    carryOverMonths = CARRY_OVER_MONTHS,
  } = await searchParams;
  const [isPremium, holidays, userCountry] = await Promise.all([
    isPremiumFn(),
    getHolidays({ country, region, year, carryOverMonths }),
    getCountry(country),
  ]);
  const userRegion = getRegion(holidays);
  const carryOverMonthsNumber = isPremium ? Number(carryOverMonths) : Number(CARRY_OVER_MONTHS);

  return (
    <SidebarProvider>
      <SidebarTrigger />
      <div className='grid min-h-screen grid-rows-[auto_1fr_auto] gap-8 p-4 sm:p-2'>
        <div className='flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6'>
          <div className='relative'>
            <div className='absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-2xl opacity-20 animate-pulse'></div>
            <div className='relative bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent'>
              <h1 className='text-4xl md:text-6xl font-extrabold tracking-tight'>🚀 Coming Soon</h1>
            </div>
          </div>
          <div className='max-w-2xl space-y-4'>
            <p className='text-xl md:text-2xl text-muted-foreground'>We're cooking up something amazing!</p>
            <p className='text-lg text-muted-foreground'>
              Forever PTO is being carefully crafted to help you maximize your vacation days. Stay tuned for the
              ultimate PTO optimization tool! 🌴
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 mt-8'>
            <div className='bg-card border rounded-xl p-6 text-center'>
              <div className='text-2xl mb-2'>📅</div>
              <h3 className='font-semibold'>Smart Planning</h3>
              <p className='text-sm text-muted-foreground'>Vacation and PTO optimization</p>
            </div>
            <div className='bg-card border rounded-xl p-6 text-center'>
              <div className='text-2xl mb-2'>🌍</div>
              <h3 className='font-semibold'>Global Holidays</h3>
              <p className='text-sm text-muted-foreground'>Support for 150+ countries</p>
            </div>
            <div className='bg-card border rounded-xl p-6 text-center'>
              <div className='text-2xl mb-2'>💎</div>
              <h3 className='font-semibold'>Premium Features</h3>
              <p className='text-sm text-muted-foreground'>Advanced analytics & insights</p>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ForeverPto;
export { generateMetadata };
// TODO:
// 2- improve SEO (a11y) + performance (db middleware, etc)
// 2- migrate to eslint
// 2- legal pages and cookies
// 2- configure CI releases
// 2- add slider for mobile calendars
// 2- change spinner for skeleton
// 2- refine styles (hover blocks, dark mode, modals, calendar, days etc).
// 35- Check copies (what is premium, limitations, behind flag features, etc)
// 34- Ko-Fi BE integration (webhook not working on localhost)
// 34- QA (what happens if there are less days than remaining)
// 1- recheck and refactor
// 2- change style to circle days (like pencil)
// 6- Add tests (also e2e)
// 9- Add CI/CD
// 10- repo settings and rules (README, etc)
// 34- MCP server? (paid func)
// 34- Readme
// 34- migrate astro
// 35- Replace kofi for stripe
// 35- allow the user to select score stragety
// 36- https://animate-ui.com/
// 24- Edit weekends (paid functionality). Edit days (add and remove days) (paid functionality)
// 24- Resend for contact
