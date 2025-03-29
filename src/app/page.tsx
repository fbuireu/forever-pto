import { isPremium as isPremiumFn } from "@application/actions/premium";
import { DEFAULT_QUERY_PARAMS } from "@const/const";
import type { SearchParams } from "@const/types";
import { getCountry } from "@infrastructure/services/country/getCountry/getCountry";
import { getHolidays } from "@infrastructure/services/holiday/getHolidays";
import { getRegion } from "@infrastructure/services/region/getRegion/getRegion";
import { SidebarTrigger } from "@modules/components/core/sidebar/atoms/sidebarTrigger/SidebarTrigger";
import { SidebarProvider } from "@modules/components/core/sidebar/provider/SidebarProvider";
import { AppSidebar } from "@ui/modules/components/appSidebar/components/appSidebar/AppSidebar";
import CalendarList from "@ui/modules/components/home/components/calendarList/CalendarList";
import HolidaysSummary from "@ui/modules/components/home/components/holidaySummary/HolidaysSummary";
import { PremiumProvider } from "@ui/providers/premium/PremiumProvider";

interface ForeverPtoProps {
	searchParams: Promise<SearchParams>;
}

const ForeverPto = async ({ searchParams }: ForeverPtoProps) => {
	const { YEAR, PTO_DAYS, ALLOW_PAST_DAYS, CARRY_OVER_MONTHS } = DEFAULT_QUERY_PARAMS;
	const {
		country,
		region,
		year = YEAR,
		ptoDays = PTO_DAYS,
		allowPastDays = ALLOW_PAST_DAYS,
		carryOverMonths = CARRY_OVER_MONTHS,
	} = await searchParams;
	const [isPremium, holidays] = await Promise.all([
		isPremiumFn(),
		getHolidays({ country, region, year, carryOverMonths }),
	]);
	const userCountry = getCountry(country);
	const userRegion = getRegion(holidays);

	return (
		<SidebarProvider>
			<PremiumProvider isPremium={isPremium}>
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
						carryOverMonths={isPremium ? Number(carryOverMonths) : 1}
						userCountry={userCountry}
						userRegion={userRegion}
					/>
				</div>
			</PremiumProvider>
		</SidebarProvider>
	);
};

export default ForeverPto;

// TODO:
// 6- Add tests (also e2e)
// 9- Add CI/CD
// 13- Next Config
// 14- i18n
// 17- Allow user to hide festivities (or add them)
// 20- Permitir al usuario cambiar los dias sugeridos
// 24- Edit weekends (paid functionality)
// 25- Edit festivities (paid functionality)
// 27- DataTable to bulk actions to remove days
// 29- Refine styles (hover blocks, etc)
// 31- Add form shadcn and zod
// 34- MCP server? (paid func)
// 34- premium with UUID value (not boolean)
// 34- use fn to format messages in stats
// 35- Refine algo in alternative days (2 days not recommending days that, with suggested days, creates a new op)
