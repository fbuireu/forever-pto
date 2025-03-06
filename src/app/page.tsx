import CalendarList from '@/components/ui/CalendarList';
import Filters from '@/components/ui/Filters';
import { getHolidays } from '@/infrastructure/services/holidays/getHolidays';
import { DEFAULT_SEARCH_PARAMS } from '@/const/const';

export interface SearchParams{
  country?: string;
  region?: string;
  year: string;
  ptoDays: string;
  allowPastDays: boolean;
}

interface ForeverPtoProps{
  searchParams: Promise<SearchParams>
}

export default async function ForeverPto({ searchParams }: ForeverPtoProps) {
  const { YEAR, PTO_DAYS, ALLOW_PAST_DAYS } = DEFAULT_SEARCH_PARAMS
    const {
        country,
        region,
        year = YEAR,
        ptoDays = PTO_DAYS,
        allowPastDays = ALLOW_PAST_DAYS.toLowerCase() === "true",
    } = await searchParams;
    const holidays = getHolidays({ country, region, year });

    return (
            <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-4 gap-8 sm:p-8">
                <Filters
                        country={country}
                        region={region}
                        year={year}
                        ptoDays={ptoDays}
                        allowPastDays={allowPastDays}
                />
                <CalendarList
                        key={holidays}
                        year={year}
                        ptoDays={ptoDays}
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
// 25- Add custom debounce hook
// 26- RECHECK ALGORYTHM (both alternatives + suggestions). 4 days issue
// 27- DataTable to bulk actions to remove days

// 28- add summary holidays in view
