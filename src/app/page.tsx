import CalendarList from '@/components/ui/CalendarList';
import Filters from '@/components/ui/Filters';
import { getHolidays } from '@/infrastructure/services/holidays/getHolidays';
import { DEFAULT_SEARCH_PARAMS } from '@/const/const';
import HolidaysSummary from '@/components/ui/HolidaysSummary';
import React from 'react';

export interface SearchParams {
    country?: string;
    region?: string;
    year: string;
    ptoDays: string;
    allowPastDays: boolean;
}

interface ForeverPtoProps {
    searchParams: Promise<SearchParams>;
}

export default async function ForeverPto({ searchParams }: ForeverPtoProps) {
    const { YEAR, PTO_DAYS, ALLOW_PAST_DAYS } = DEFAULT_SEARCH_PARAMS;
    const {
        country,
        region,
        year = YEAR,
        ptoDays = PTO_DAYS,
        allowPastDays = ALLOW_PAST_DAYS.toLowerCase() === 'true',
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
                <HolidaysSummary holidays={holidays} />
                <CalendarList
                        key={JSON.stringify(holidays)}
                        year={Number(year)}
                        ptoDays={Number(ptoDays)}
                        allowPastDays={allowPastDays}
                        holidays={holidays}
                />
                <footer className="mt-8 text-center text-sm text-muted-foreground">
                    <div className="flex flex-wrap justify-center gap-4 mb-2">
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-accent/30 mr-2 rounded-sm"></div>
                            <span>Fines de semana</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-yellow-100 mr-2 rounded-sm border border-yellow-300"></div>
                            <span>Festivos</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-primary text-primary-foreground mr-2 rounded-sm flex items-center justify-center">
                                <span className="text-xs">P</span>
                            </div>
                            <span>Días PTO seleccionados</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 mr-2 rounded-sm"></div>
                            <span>Días sugeridos</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 mr-2 rounded-sm"></div>
                            <span>Alternativas similares</span>
                        </div>
                    </div>
                    <p>
                        Los fines de semana y festivos ya están preseleccionados. Haz clic en cualquier día laborable
                        para añadirlo como día PTO.
                    </p>
                    <p>Limitations: las sugerencias se basan en los bloques de dias (si se hace hover sobre un grupo de
                        3 dias sugeridos se buscaran alternativas que, con 3 dias de PTO, generen los mismos dias
                        festivos)</p>
                </footer>
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
// 20- Permitir al usuario cambiar los dias sugeridos
// 21- Añadir un summary de cuanto hemos optimizado las vacaciones
// 23- Adjust thresholds (paid funcionality)
// 24- Edit weekends (paid functionality)
// 25- Edit festivities (paid functionality)
// 25- Add sidebar
// 26- RECHECK ALGORYTHM (both alternatives + suggestions). 4 days issue
// 27- DataTable to bulk actions to remove days
