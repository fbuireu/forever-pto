// app/page.tsx - Server Component
import { getHolidays } from '@/lib/holidays';
import Filters from '@/components/ui/Filters';
import CalendarList from '@/components/ui/CalendarList';

const DEFAULT_PTO_DAYS = 22;

interface SearchParams {
    country?: string;
    region?: string;
    year?: string;
    availablePtoDays?: string;
    allowPastDays?: string;
}

export default async function PTOPlannerPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    // Get values from URL with defaults
    const {
        country = 'es',
        region = 'ca',
        year = String(new Date().getFullYear()),
        availablePtoDays = 22,
        allowPastDays = false,
    } = await searchParams;
    const holidays = await getHolidays(country, region, year);

    return (
            <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-4 gap-8 sm:p-8">
                <Filters
                        country={country}
                        region={region}
                        year={year}
                        availablePtoDays={availablePtoDays}
                        allowPastDays={allowPastDays}
                />
                <CalendarList
                        key={holidays}
                        country={country}
                        region={region}
                        year={year}
                        availablePtoDays={availablePtoDays}
                        allowPastDays={allowPastDays}
                        holidays={holidays}
                />
            </div>
    );
}
// TODO:
// 1- Refactor
// 2- Isolate functions
// 4- Tema fin de semana
// 5- Revisar seleccion i ratio
// 6- Add tests
// 7- Add eslint, prettierc, and tools prehook
// 8- Add dependabot/ Renovate
// 9- Add CI/CD
// 10- Get Country, region and holidays by IP
// 12- SSR + URL state (use startTransition as well)
// 13- Next Config + TS Config
// 14- i18n
// 15- dark mode
// 17- Allow user to hide festivities (or add them)
// 18- Allow user to change weekends
// 19- change forEach to for...of
// 23- Adjust threshold (paid funcionality)
// 24- Edit weekends (paid functionality)
// 25- Edit festivities (paid functionality)
// 26- Recheck algorythm


