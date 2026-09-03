import { EN, ES } from "@infrastructure/i18n/locales";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const NAMESPACE = "termsOfService";
const ENV = { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_CONTACT_EMAIL: "test@test.com" };

const mockGetCloudflareContext = vi.fn();
const MockLegalLayout = vi.fn().mockReturnValue(null);
const mockGetTranslations = vi.fn();
const mockCreateRichLink = vi.fn().mockReturnValue(vi.fn().mockReturnValue(null));
const mockRich = vi.fn().mockReturnValue(null);

vi.mock("@opennextjs/cloudflare", () => ({
	getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@ui/modules/layout/LegalLayout", () => ({
	LegalLayout: MockLegalLayout,
}));

vi.mock("@ui/modules/core/primitives/RichLink", () => ({
	createRichLink: mockCreateRichLink,
}));

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
}));

const { default: TermsOfServicePage } = await import("./page");

const makeParams = (locale = EN) => ({ params: Promise.resolve({ locale: locale as never }) });

describe("terms-of-service/page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const mockT = Object.assign(
			vi.fn((key: string) => `t:${key}`),
			{
				rich: mockRich,
			},
		);
		mockGetTranslations.mockResolvedValue(mockT);
		mockGetCloudflareContext.mockResolvedValue({ env: ENV });
	});

	it("renders LegalLayout with translated title", async () => {
		const element = await TermsOfServicePage(makeParams());
		expect(element.type).toBe(MockLegalLayout);
		expect(element.props.title).toBe("t:title");
	});

	it("calls getTranslations with the termsOfService namespace", async () => {
		await TermsOfServicePage(makeParams());
		expect(mockGetTranslations).toHaveBeenCalledWith(expect.objectContaining({ namespace: NAMESPACE }));
	});

	it("passes locale to getTranslations", async () => {
		await TermsOfServicePage(makeParams(ES));
		expect(mockGetTranslations).toHaveBeenCalledWith(expect.objectContaining({ locale: ES }));
	});

	it("renders lastUpdated prop", async () => {
		const element = await TermsOfServicePage(makeParams());
		expect(element.props.lastUpdated).toBeDefined();
	});

	it("renders the bold chunks of the refund exclusions in a strong element", async () => {
		await TermsOfServicePage(makeParams());
		const exclusions = mockRich.mock.calls.find(([key]) => key === "sections.refundPolicy.exclusions.description");
		const tags = exclusions?.[1] as { b: (chunks: ReactNode) => ReactNode };

		const { container } = render(tags.b("no refund"));

		expect(container.querySelector("strong")?.textContent).toBe("no refund");
	});
});
