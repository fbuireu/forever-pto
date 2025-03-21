import { DEFAULT_SEARCH_PARAMS } from '@const/const';
import type { SearchParams } from '@const/types';
import { isPremium } from '@infrastructure/services/cookies/isPremium';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { AppSidebar } from '@ui/modules/components/appSidebar/components/appSidebar/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@ui/modules/components/core/sidebar/Sidebar';
import CalendarList from '@ui/modules/components/home/components/calendarList/CalendarList';
import HolidaysSummary from '@ui/modules/components/home/components/holidaySummary/HolidaysSummary';
import { PremiumProvider } from '@ui/providers/premium/PremiumProvider';

interface ForeverPtoProps {
	searchParams: Promise<SearchParams>;
}

export default async function ForeverPto({ searchParams }: ForeverPtoProps) {
	const { YEAR, PTO_DAYS, ALLOW_PAST_DAYS, CARRY_OVER_MONTHS } = DEFAULT_SEARCH_PARAMS;
	const {
		country,
		region,
		year = YEAR,
		ptoDays = PTO_DAYS,
		allowPastDays = ALLOW_PAST_DAYS,
		carryOverMonths = CARRY_OVER_MONTHS,
	} = await searchParams;
	const holidays = await getHolidays({ country, region, year, carryOverMonths });
	const premiumStatus = await isPremium();

	return (
		<SidebarProvider>
			<PremiumProvider initialPremiumStatus={premiumStatus}>
				<AppSidebar
					country={country}
					ptoDays={ptoDays}
					region={region}
					year={year}
					allowPastDays={allowPastDays}
					carryOverMonths={carryOverMonths}
				/>
				<SidebarTrigger />
				<div className="grid min-h-screen grid-rows-[auto_1fr_auto] gap-8 p-4 sm:p-8">
					<HolidaysSummary holidays={holidays} />
					<CalendarList
						key={JSON.stringify(holidays)}
						year={Number(year)}
						ptoDays={Number(ptoDays)}
						allowPastDays={allowPastDays}
						holidays={holidays}
						carryOverMonths={premiumStatus ? Number(carryOverMonths) : 1}
					/>
				</div>
			</PremiumProvider>
		</SidebarProvider>
	);
}

// TODO:
// 1- Refactor
// 2- Isolate functions
// 4- Tema fin de semana
// 6- Add tests (also e2e)
// 9- Add CI/CD
// 13- Next Config + TS Config
// 14- i18n
// 17- Allow user to hide festivities (or add them)
// 18- Allow user to change weekends
// 19- change forEach to for...of
// 20- Permitir al usuario cambiar los dias sugeridos
// 21- Añadir un summary de cuanto hemos optimizado las vacaciones
// 23- Adjust thresholds (paid funcionality)
// 24- Edit weekends (paid functionality)
// 25- Edit festivities (paid functionality)
// 25- Refine sidebar
// 26- RECHECK ALGORYTHM (both alternatives + suggestions). 4 days issue
// 27- DataTable to bulk actions to remove days
// 29- Refine styles (hover blocks, etc)
// 30- Improve way of handling premium features (right now monthsToShow are set to 1 but once it's present, it can be changed in the URL)
// 31- Add form shadcn and zod
// 32- Add safeguard to avoid rerenders when same data is passed etc
