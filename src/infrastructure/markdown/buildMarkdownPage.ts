import ca from "@i18n/messages/ca.json";
import de from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import es from "@i18n/messages/es.json";
import fr from "@i18n/messages/fr.json";
import it from "@i18n/messages/it.json";
import { CA, DE, EN, ES, FR, IT } from "@infrastructure/i18n/locales";
import { getLocaleFromPathname, localePath } from "@infrastructure/i18n/utils/url";
import { createTranslator } from "next-intl";
import pkg from "../../../package.json";

const MESSAGES: Record<string, typeof en> = {
	[CA]: ca,
	[DE]: de,
	[EN]: en,
	[ES]: es,
	[FR]: fr,
	[IT]: it,
};

const MARKDOWN_ROUTES = [
	{ path: "/legal/cookie-policy", title: "cookiePolicy.title", description: "cookiePolicy.description" },
	{ path: "/legal/privacy-policy", title: "privacyPolicy.title", description: "privacyPolicy.description" },
	{ path: "/legal/terms-of-service", title: "termsOfService.title", description: "termsOfService.description" },
	{ path: "/legal/legal-notice", title: "legalNotice.title", description: "legalNotice.description" },
	{ path: "/payment/confirmation", title: "paymentConfirmation.title", description: undefined },
] as const;

export async function buildMarkdownPage(baseUrl: string, pathname: string) {
	const locale = getLocaleFromPathname(pathname);
	const messages = MESSAGES[locale];
	const t = createTranslator({ locale, messages, namespace: "metadata" });

	const route = MARKDOWN_ROUTES.find(({ path }) => pathname.includes(path));

	if (route) {
		return `# ${t(route.title)}

${route.description ? `${t(route.description)}\n` : ""}
## Version

${pkg.version}

## URL

${baseUrl}${localePath(locale, route.path)}
`;
	}

	if (pathname.includes("/planner")) {
		const tPlanner = createTranslator({ locale, messages, namespace: "planner" });

		return `# ${t("planner.title")}

${t("planner.description")}

## ${tPlanner("title")}

${tPlanner("description")}

## Features

- Holiday calendar with national and regional public holidays
- Bridge day suggestions (connect short weekends into multi-day breaks)
- Three optimization strategies: Grouped, Optimized, Balanced
- PTO accrual calculator and salary calculator
- Export to Google Calendar, Outlook, and Apple Calendar

## How to Use

1. The planner auto-detects your country via your IP
2. Adjust country and region if needed
3. Choose a strategy: Grouped (fewest trips), Optimized (best ROI), or Balanced
4. Review suggested days and manually edit as needed
5. Export your schedule

## Version

${pkg.version}

## URL

${baseUrl}${localePath(locale, "/planner")}
`;
	}

	return `# ${t("title")}

${t("description")}

## Features

- **Holiday Detection** — Automatic country detection with national and regional holidays
- **Bridge Day Optimizer** — Identifies the best days to take off to maximize streaks
- **Three Strategies** — Grouped (fewest trips), Optimized (best efficiency), Balanced
- **Calculations** — PTO accrual, PTO vs salary, workday counter, date stats
- **Export** — Send your schedule to Google Calendar, Outlook, or Apple Calendar
- **Multilingual** — Available in English, Spanish, Catalan, Italian, French, and German

## How It Works

1. Open the planner at ${baseUrl}${localePath(locale, "/planner")}
2. Your country is detected automatically; adjust country and region if needed
3. Select a year and optimization strategy
4. The planner generates a list of suggested PTO days that bridge holidays
5. Review suggestions, make manual edits, then export

## API

- \`GET /api/health\` — Service status check

## Version

${pkg.version}

## Site

${baseUrl}
`;
}
