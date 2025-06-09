import { isPremium as isPremiumFn } from "@application/actions/premium";
import { DEFAULT_QUERY_PARAMS } from "@const/const";
import type { SearchParams } from "@const/types";
import { getCountry } from "@infrastructure/services/country/getCountry/getCountry";
import { getHolidays } from "@infrastructure/services/holiday/getHolidays";
import { getRegion } from "@infrastructure/services/region/getRegion/getRegion";
import { Footer } from "@modules/components/core/footer/Footer";
import { SidebarTrigger } from "@modules/components/core/sidebar/atoms/sidebarTrigger/SidebarTrigger";
import { SidebarProvider } from "@modules/components/core/sidebar/provider/SidebarProvider/SidebarProvider";
import { AppSidebar } from "@ui/modules/components/appSidebar/components/appSidebar/AppSidebar";
import CalendarList from "@ui/modules/components/home/components/calendarList/CalendarList";
import HolidaysSummary from "@ui/modules/components/home/components/holidaySummary/HolidaysSummary";
import { HolidaysProvider } from "@ui/providers/holidays/HolidaysProvider";
import { PremiumProvider } from "@ui/providers/premium/PremiumProvider";
import type { Locale } from "next-intl";
import { generateMetadata } from "./metadata";

export interface ForeverPtoProps {
	searchParams: Promise<SearchParams>;
	params: Promise<{ locale: Locale }>;
}

const ForeverPto = async ({ searchParams, params }: ForeverPtoProps) => {
	const { locale } = await params;
	const { YEAR, PTO_DAYS, ALLOW_PAST_DAYS, CARRY_OVER_MONTHS } = DEFAULT_QUERY_PARAMS;
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
					locale={locale}
				/>
				<SidebarTrigger />
				<div className="grid min-h-screen grid-rows-[auto_1fr_auto] gap-8 p-4 sm:p-8">
					<HolidaysProvider initialHolidays={holidays}>
						<HolidaysSummary />
						<CalendarList
							year={Number(year)}
							ptoDays={Number(ptoDays)}
							allowPastDays={allowPastDays}
							carryOverMonths={isPremium ? Number(carryOverMonths) : 1}
							userCountry={userCountry}
							userRegion={userRegion}
						/>
					</HolidaysProvider>
					<Footer locale={locale} />
				</div>
			</PremiumProvider>
		</SidebarProvider>
	);
};

export default ForeverPto;
export { generateMetadata };
// TODO:
// 1- recheck and refactor
// 6- Add tests (also e2e)
// 9- Add CI/CD
// 10- repo settings and rules (README, etc)
// 34- MCP server? (paid func)
// 34- use fn to format messages in stats
// 34- Readme
// 35- Replace kofi for stripe
// 35- allow the user to select score stragety

// TODO: (release)
// 2- SEO + check messages
// 35- Check copies
// 2- add FAQ + roadmap
// 2- refine styles (hover blocks, dark mode, modals, calendar, days etc)
// 2- remove env vars
// 24- Edit weekends (paid functionality). Edit days (add and remove days) (paid functionality)
// 34- Ko-Fi BE integration (webhook not working on localhost)
