import { isPremium as isPremiumFn } from "@application/actions/premium";
import { DEFAULT_QUERY_PARAMS } from "@const/const";
import type { SearchParams } from "@const/types";
import { getCountry } from "@infrastructure/services/country/getCountry/getCountry";
import { getHolidays } from "@infrastructure/services/holiday/getHolidays";
import { getRegion } from "@infrastructure/services/region/getRegion/getRegion";
import { Legend } from "@modules/components/core/legend/Legend";
import { SidebarTrigger } from "@modules/components/core/sidebar/atoms/sidebarTrigger/SidebarTrigger";
import { SidebarProvider } from "@modules/components/core/sidebar/provider/SidebarProvider/SidebarProvider";
import { DevFooter } from "@modules/components/home/components/devFooter/DevFooter";
import { Faq } from "@modules/components/home/components/faq/Faq";
import { HowItWorks } from "@modules/components/home/components/howItWorks/HowItWorks";
import { Roadmap } from "@modules/components/home/components/roadmap/Roadmap";
import { AppSidebar } from "@ui/modules/components/appSidebar/components/appSidebar/AppSidebar";
import CalendarList from "@ui/modules/components/home/components/calendarList/CalendarList";
import HolidaysSummary from "@ui/modules/components/home/components/holidaySummary/HolidaysSummary";
import { HolidaysProvider } from "@ui/providers/holidays/HolidaysProvider";
import { PremiumProvider } from "@ui/providers/premium/PremiumProvider";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { generateMetadata } from "./metadata";

export const runtime = "edge";

export interface ForeverPtoProps {
	searchParams: Promise<SearchParams>;
	params: Promise<{ locale: Locale }>;
}

const ForeverPto = async ({ searchParams, params }: ForeverPtoProps) => {
	const { locale } = await params;
	const { YEAR, PTO_DAYS, ALLOW_PAST_DAYS, CARRY_OVER_MONTHS } = DEFAULT_QUERY_PARAMS;
	const t = await getTranslations({ locale, namespace: "home" });
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
				<div className="grid min-h-screen grid-rows-[auto_1fr_auto] gap-8 p-4 sm:p-2">
					<HolidaysProvider initialHolidays={holidays}>
						<div className="text-center mt-4">
							<h1 className="text-xl font-extrabold tracking-tight lg:text-6xl">{t("title")}</h1>
							<p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
						</div>
						<HolidaysSummary />
						<CalendarList
							year={Number(year)}
							ptoDays={Number(ptoDays)}
							allowPastDays={allowPastDays}
							carryOverMonths={carryOverMonthsNumber}
							userCountry={userCountry}
							userRegion={userRegion}
						/>
					</HolidaysProvider>
					<Legend locale={locale} />
					<HowItWorks locale={locale} />
					<Faq locale={locale} />
					<Roadmap locale={locale} />
					<DevFooter />
				</div>
			</PremiumProvider>
		</SidebarProvider>
	);
};

export default ForeverPto;
export { generateMetadata };
// TODO:
// 2- migrate to eslint
// 2- legal pages and cookies (check consent Cloudflare)
// 2- configure CI releases
// 2- add slider for mobile calendars
// 2- change spinner for skeleton
// 2- improve SEO (a11y)
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
