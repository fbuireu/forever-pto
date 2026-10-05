import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import en from "@i18n/messages/en.json";
import { EN } from "@infrastructure/i18n/locales";
import { type RenderResult, render } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { createFormatter, createTranslator, type Locale, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAIN_CONTENT_ID, SkipToContent } from "./SkipToContent";

const SRC_ROOT = resolve(__dirname, "../../..");
const LANDMARK = /id=(\{MAIN_CONTENT_ID\}|"main-content")/;

const SHELLS = [
	"app/[locale]/(app)/payment/confirmation/page.tsx",
	"app/[locale]/(marketing)/legal/layout.tsx",
	"app/[locale]/(marketing)/page.tsx",
	"ui/modules/pages/error/ErrorContent.tsx",
	"ui/modules/pages/not-found/NotFoundContent.tsx",
	"ui/modules/sidebar/AppSidebar.tsx",
];

const componentFiles = (directory: string): string[] =>
	readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return componentFiles(path);
		return entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx") ? [path] : [];
	});

const declaring = componentFiles(SRC_ROOT)
	.filter((path) => LANDMARK.test(readFileSync(path, "utf8")))
	.map((path) => relative(SRC_ROOT, path).replaceAll("\\", "/"))
	.sort();

const mockConfirmation = vi.hoisted(() => vi.fn());
const mockGetTranslations = vi.hoisted(() => vi.fn());
const mockGetFormatter = vi.hoisted(() => vi.fn());
const mockLogger = { warn: vi.fn(), logError: vi.fn() };

interface GetTranslationsParams {
	locale: Locale;
	namespace: "notFound" | "paymentConfirmation.failed" | "paymentConfirmation.success";
}

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
	getFormatter: mockGetFormatter,
	setRequestLocale: vi.fn(),
}));

vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@application/i18n/navigation", () => ({ Link: () => null }));
vi.mock("@application/shared/utils/clientLog", () => ({ logClientError: vi.fn() }));
vi.mock("@infrastructure/layers", () => ({ ApplicationLayer: Layer.empty }));
vi.mock("@infrastructure/services/payments/confirmation", () => ({ confirmation: mockConfirmation }));
vi.mock("@infrastructure/logging/logger", () => ({
	logger: mockLogger,
}));
vi.mock("@ui/modules/core/primitives/Button", () => ({ Button: () => null }));
vi.mock("@ui/modules/core/primitives/Card", () => {
	const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
	return {
		Card: passthrough,
		CardContent: passthrough,
		CardDescription: passthrough,
		CardHeader: passthrough,
		CardTitle: passthrough,
	};
});
vi.mock("@ui/modules/premium/PremiumSessionSync", () => ({ PremiumSessionSync: () => null }));
vi.mock("@ui/modules/shared/Header", () => ({ Header: () => null }));
vi.mock("@ui/modules/shared/footer/Footer", () => ({ Footer: () => null }));

const { default: LegalRouteLayout } = await import("@app/[locale]/(marketing)/legal/layout");
const { default: PaymentConfirmationPage } = await import("@app/[locale]/(app)/payment/confirmation/page");
const { NotFoundContent } = await import("@ui/modules/pages/not-found/NotFoundContent");
const { ErrorContent } = await import("@ui/modules/pages/error/ErrorContent");

const locale = Promise.resolve<{ locale: Locale }>({ locale: EN });
const searchParams = Promise.resolve({ payment_intent: "pi_test_123" });

const CONFIRMATION = { id: "pi_test_123", status: "succeeded", amount: 10, currency: "USD" };

const landmarks = (tree: RenderResult) => tree.container.querySelectorAll(`#${MAIN_CONTENT_ID}`).length;

describe("skip to content", () => {
	beforeEach(() => {
		mockConfirmation.mockReturnValue(Effect.succeed(CONFIRMATION));
		mockGetTranslations.mockImplementation(async ({ locale, namespace }: GetTranslationsParams) =>
			createTranslator({ locale, messages: en, namespace }),
		);
		mockGetFormatter.mockImplementation(async ({ locale }: { locale: Locale }) => createFormatter({ locale }));
	});

	it("points the link at the landmark id", () => {
		const { getByRole } = render(<SkipToContent label="Skip" />);
		expect(getByRole("link").getAttribute("href")).toBe(`#${MAIN_CONTENT_ID}`);
	});

	it("names every shell that declares the landmark, so a new one cannot be forgotten", () => {
		expect(declaring).toEqual([...SHELLS].sort());
	});

	it("shows the destination it received focus, so taking the link is not a silent no-op", () => {
		const shell = readFileSync(join(SRC_ROOT, "ui/modules/sidebar/AppSidebar.tsx"), "utf8");
		const landmark = shell.slice(shell.indexOf("<SidebarInset"), shell.indexOf(">", shell.indexOf("<SidebarInset")));

		expect(landmark).toContain("outline-none");
		expect(landmark).toContain("focus-visible:ring-[3px]");
	});

	it("resolves exactly once on the legal shell", async () => {
		expect(landmarks(render(await LegalRouteLayout({ children: null, params: locale })))).toBe(1);
	});

	it("resolves exactly once on the not-found shell", async () => {
		expect(landmarks(render(await NotFoundContent({ locale: EN })))).toBe(1);
	});

	it("resolves exactly once on the error shell", () => {
		const error = Object.assign(new Error("boom"), { digest: "abc" });
		const shell = render(
			<NextIntlClientProvider locale={EN} messages={en}>
				<ErrorContent error={error} reset={vi.fn()} />
			</NextIntlClientProvider>,
		);

		expect(landmarks(shell)).toBe(1);
	});

	it("resolves exactly once on the payment confirmation shell", async () => {
		expect(landmarks(render(await PaymentConfirmationPage({ searchParams, params: locale })))).toBe(1);
	});

	it("resolves exactly once on the payment confirmation shell when the payment failed", async () => {
		mockConfirmation.mockReturnValueOnce(Effect.succeed(null));
		const element = await PaymentConfirmationPage({ searchParams, params: locale });
		const resolved = await (element.type as (props: unknown) => Promise<never>)(element.props);
		expect(landmarks(render(resolved))).toBe(1);
	});
});
