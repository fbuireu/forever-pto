import { initializeServerData } from "@application/stores/server/serverStore";
import type { SearchParams } from "@const/types";
import { getCountry } from "@infrastructure/services/country/getCountry/getCountry";
import { getHolidays } from "@infrastructure/services/holiday/getHolidays";
import { SidebarTrigger } from "@modules/components/core/sidebar/atoms/sidebarTrigger/SidebarTrigger";
import { SidebarProvider } from "@modules/components/core/sidebar/provider/SidebarProvider/SidebarProvider";
import { AppSidebar } from "@ui/modules/components/appSidebar/components/appSidebar/AppSidebar";
import { Skeleton } from "@ui/modules/components/core/skeleton/Skeleton";
import { AppProvider } from "@ui/providers/app/AppProvider";
import dynamic from "next/dynamic";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { generateMetadata } from "./metadata";

const DevFooter = dynamic(
	() =>
		import("@ui/modules/components/home/components/devFooter/DevFooter").then((mod) => ({ default: mod.DevFooter })),
	{
		loading: () => <Skeleton size="2xl" className="w-full" />,
	},
);

const Faq = dynamic(
	() => import("@ui/modules/components/home/components/faq/Faq").then((mod) => ({ default: mod.Faq })),
	{
		loading: () => <Skeleton size="5xl" className="w-full" />,
	},
);

const HowItWorks = dynamic(
	() =>
		import("@ui/modules/components/home/components/howItWorks/HowItWorks").then((mod) => ({ default: mod.HowItWorks })),
	{
		loading: () => <Skeleton size="7xl" className="w-full" />,
	},
);

const Roadmap = dynamic(
	() => import("@ui/modules/components/home/components/roadmap/Roadmap").then((mod) => ({ default: mod.Roadmap })),
	{
		loading: () => <Skeleton size="5xl" className="w-full" />,
	},
);

const Legend = dynamic(
	() => import("@ui/modules/components/core/legend/Legend").then((mod) => ({ default: mod.Legend })),
	{
		loading: () => <Skeleton size="2xl" className="w-full" />,
	},
);

const CalendarList = dynamic(() => import("@ui/modules/components/home/components/calendarList/CalendarList"), {
	loading: () => <Skeleton size="11xl" className="w-full" />,
});

const HolidaysSummary = dynamic(() => import("@ui/modules/components/home/components/holidaySummary/HolidaysSummary"), {
	loading: () => <Skeleton size="4xl" className="w-full" />,
});

export const runtime = "edge";

export interface ForeverPtoProps {
	searchParams: Promise<SearchParams>;
	params: Promise<{ locale: Locale }>;
}

async function PageHeader({ locale }: { locale: Locale }) {
	const t = await getTranslations({ locale, namespace: "home" });

	return (
		<div className="text-center mt-4">
			<h1 className="text-xl font-extrabold tracking-tight lg:text-6xl">{t("title")}</h1>
			<p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
		</div>
	);
}

const ForeverPto = async ({ searchParams, params }: ForeverPtoProps) => {
	const { locale } = await params;
	const resolvedSearchParams = await searchParams;

	// Initialize server store with URL params
	await initializeServerData(resolvedSearchParams);

	// Load data for providers
	const { country, region, year, carryOverMonths } = resolvedSearchParams;
	const [isPremium, holidays, userCountry] = await Promise.all([
		import("@application/actions/premium").then((mod) => mod.isPremium()),
		getHolidays({ country, region, year, carryOverMonths }),
		getCountry(country),
	]);

	return (
		<SidebarProvider>
			<AppProvider initialHolidays={holidays} initialIsPremium={isPremium}>
				<AppSidebar locale={locale} />
				<SidebarTrigger />

				<div className="grid min-h-screen grid-rows-[auto_1fr_auto] gap-8 p-4 sm:p-2">
					<Suspense fallback={<Skeleton size="2xl" className="w-full" />}>
						<PageHeader locale={locale} />
					</Suspense>

					<Suspense fallback={<Skeleton size="4xl" className="w-full" />}>
						<HolidaysSummary />
					</Suspense>

					<Suspense fallback={<Skeleton size="11xl" className="w-full" />}>
						<CalendarList />
					</Suspense>

					<Suspense fallback={<Skeleton size="2xl" className="w-full" />}>
						<Legend locale={locale} />
					</Suspense>

					<Suspense fallback={<Skeleton size="7xl" className="w-full" />}>
						<HowItWorks locale={locale} />
					</Suspense>

					<Suspense fallback={<Skeleton size="5xl" className="w-full" />}>
						<Faq locale={locale} />
					</Suspense>

					<Suspense fallback={<Skeleton size="5xl" className="w-full" />}>
						<Roadmap locale={locale} />
					</Suspense>

					<Suspense fallback={<Skeleton size="2xl" className="w-full" />}>
						<DevFooter />
					</Suspense>
				</div>
			</AppProvider>
		</SidebarProvider>
	);
};

export default ForeverPto;
export { generateMetadata };

// TODO:
// 2- performance (if a component needs to be client usew tanstack)
// 2- improve SEO (a11y)
// 2- favicon
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
