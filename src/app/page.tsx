import { DEFAULT_SEARCH_PARAMS } from '@const/const';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { SidebarProvider, SidebarTrigger } from '@modules/components/core/Sidebar';
import CalendarList from '@modules/components/home/CalendarList';
import HolidaysSummary from '@modules/components/home/HolidaysSummary';
import { AppSidebar } from '@modules/components/sidebar/AppSidebar';
import { PremiumProvider } from '@ui/providers/PremiumProvider';
import { cookies } from 'next/headers';

export interface SearchParams {
	country?: string;
	region?: string;
	year: string;
	ptoDays: string;
	allowPastDays: string;
	carryOverMonths: string;
}

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
	const isPremium = (await cookies()).get("premium")?.value === "true";

	return (
		<SidebarProvider>
			<PremiumProvider initialPremiumStatus={isPremium}>
				<AppSidebar
					country={country}
					ptoDays={ptoDays}
					region={region}
					year={year}
					allowPastDays={allowPastDays}
					carryOverMonths={carryOverMonths}
				/>
				<SidebarTrigger />
				<main>
					<div className="grid min-h-screen grid-rows-[auto_1fr_auto] gap-8 p-4 sm:p-8">
						<HolidaysSummary holidays={holidays} />
						<CalendarList
							key={JSON.stringify(holidays)}
							year={Number(year)}
							ptoDays={Number(ptoDays)}
							allowPastDays={allowPastDays}
							holidays={holidays}
							carryOverMonths={Number(carryOverMonths)}
						/>
						<footer className="mt-8 text-center text-sm text-muted-foreground">
							<div className="mb-2 flex flex-wrap justify-center gap-4">
								<div className="flex items-center">
									<div className="mr-2 h-4 w-4 rounded-sm bg-accent/30" />
									<span>Fines de semana</span>
								</div>
								<div className="flex items-center">
									<div className="mr-2 h-4 w-4 rounded-sm border border-yellow-300 bg-yellow-100" />
									<span>Festivos</span>
								</div>
								<div className="flex items-center">
									<div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm bg-primary text-primary-foreground">
										<span className="text-xs">P</span>
									</div>
									<span>Días PTO seleccionados</span>
								</div>
								<div className="flex items-center">
									<div className="mr-2 h-4 w-4 rounded-sm bg-green-100 dark:bg-green-900/30" />
									<span>Días sugeridos</span>
								</div>
								<div className="flex items-center">
									<div className="mr-2 h-4 w-4 rounded-sm bg-purple-100 dark:bg-purple-900/30" />
									<span>Alternativas similares</span>
								</div>
							</div>
							<p>
								Los fines de semana y festivos ya están preseleccionados. Haz clic en cualquier día laborable para
								añadirlo como día PTO.
							</p>
							<p>
								Limitations: las sugerencias se basan en los bloques de dias (si se hace hover sobre un grupo de 3 dias
								sugeridos se buscaran alternativas que, con 3 dias de PTO, generen los mismos dias festivos)
							</p>
						</footer>
					</div>
				</main>
			</PremiumProvider>
		</SidebarProvider>
	);
}
// TODO:
// 1- Refactor
// 2- Isolate functions
// 3- Folder structure
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
