import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { EN } from "@infrastructure/i18n/locales";
import { render } from "@testing-library/react";
import { Effect, Layer } from "effect";
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
const mockLogger = { warn: vi.fn(), logError: vi.fn() };

vi.mock("next-intl", async (importOriginal) => ({
	...(await importOriginal<typeof import("next-intl")>()),
	useTranslations: () => (key: string) => key,
}));

vi.mock("next-intl/server", () => ({
	getTranslations: vi.fn(async () => (key: string) => key),
	getFormatter: vi.fn(async () => ({ number: (value: number) => String(value) })),
	setRequestLocale: vi.fn(),
}));

vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@application/i18n/navigation", () => ({ Link: () => null }));
vi.mock("@application/shared/utils/clientLog", () => ({ logClientError: vi.fn() }));
vi.mock("@infrastructure/layers", () => ({ ApplicationLayer: Layer.empty }));
vi.mock("@infrastructure/services/payments/confirmation", () => ({ confirmation: mockConfirmation }));
vi.mock("@infrastructure/clients/logging/better-stack/client", () => ({
	getBetterStackInstance: () => mockLogger,
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
vi.mock("@ui/modules/pages/homepage/navigation/Navigation", () => ({ Header: () => null }));
vi.mock("@ui/modules/shared/footer/Footer", () => ({ Footer: () => null }));

const { default: LegalRouteLayout } = await import("@app/[locale]/(marketing)/legal/layout");
const { default: PaymentConfirmationPage } = await import("@app/[locale]/(app)/payment/confirmation/page");
const { NotFoundContent } = await import("@ui/modules/pages/not-found/NotFoundContent");
const { ErrorContent } = await import("@ui/modules/pages/error/ErrorContent");

const locale = Promise.resolve({ locale: EN as never });
const searchParams = Promise.resolve({ payment_intent: "pi_test_123" });

const CONFIRMATION = { id: "pi_test_123", status: "succeeded", amount: 10, currency: "USD" };

const landmark = (tree: { container: HTMLElement }) => tree.container.querySelector(`#${MAIN_CONTENT_ID}`);

describe("skip to content", () => {
	beforeEach(() => {
		mockConfirmation.mockReturnValue(Effect.succeed(CONFIRMATION));
	});

	it("points the link at the landmark id", () => {
		const { getByRole } = render(<SkipToContent label="Skip" />);
		expect(getByRole("link").getAttribute("href")).toBe(`#${MAIN_CONTENT_ID}`);
	});

	it("names every shell that declares the landmark, so a new one cannot be forgotten", () => {
		expect(declaring).toEqual([...SHELLS].sort());
	});

	it("declares the landmark exactly once per shell, so the link never lands on a duplicate", () => {
		expect(declaring.length).toBe(new Set(declaring).size);
	});

	it("shows the destination it received focus, so taking the link is not a silent no-op", () => {
		const shell = readFileSync(join(SRC_ROOT, "ui/modules/sidebar/AppSidebar.tsx"), "utf8");
		const landmark = shell.slice(shell.indexOf("<SidebarInset"), shell.indexOf(">", shell.indexOf("<SidebarInset")));

		expect(landmark).toContain("outline-none");
		expect(landmark).toContain("focus-visible:ring-[3px]");
	});

	it("resolves on the legal shell", async () => {
		expect(landmark(render(await LegalRouteLayout({ children: null, params: locale })))).not.toBeNull();
	});

	it("resolves on the not-found shell", async () => {
		expect(landmark(render(await NotFoundContent({ locale: EN as never })))).not.toBeNull();
	});

	it("resolves on the error shell", () => {
		const error = Object.assign(new Error("boom"), { digest: "abc" });
		expect(landmark(render(<ErrorContent error={error} reset={vi.fn()} />))).not.toBeNull();
	});

	it("resolves on the payment confirmation shell", async () => {
		expect(landmark(render(await PaymentConfirmationPage({ searchParams, params: locale })))).not.toBeNull();
	});

	it("resolves on the payment confirmation shell when the payment failed", async () => {
		mockConfirmation.mockReturnValueOnce(Effect.succeed(null));
		const element = await PaymentConfirmationPage({ searchParams, params: locale });
		const resolved = await (element.type as (props: unknown) => Promise<never>)(element.props);
		expect(landmark(render(resolved))).not.toBeNull();
	});
});
