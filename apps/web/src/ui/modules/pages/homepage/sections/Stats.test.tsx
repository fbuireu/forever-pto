import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import { render } from "@testing-library/react";
import { createFormatter, createTranslator, type Locale } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());
const mockGetFormatter = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
	getFormatter: mockGetFormatter,
}));

import { Stats } from "./Stats";

interface RenderStatsParams {
	locale: Locale;
	messages: typeof enMessages;
}

const renderStats = async ({ locale, messages }: RenderStatsParams) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "homepage" }));
	mockGetFormatter.mockResolvedValue(createFormatter({ locale }));
	const { container } = render(await Stats());
	return container.textContent ?? "";
};

describe("Stats", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("formats the multiplier with the German decimal separator", async () => {
		expect(await renderStats({ locale: "de", messages: deMessages })).toContain("2,14×");
	});

	it("formats the multiplier with the English decimal separator", async () => {
		expect(await renderStats({ locale: "en", messages: enMessages })).toContain("2.14×");
	});

	it("abbreviates the suggestion count the way the locale does, which German does not", async () => {
		expect(await renderStats({ locale: "de", messages: deMessages })).toContain("12.000+");
		expect(await renderStats({ locale: "en", messages: enMessages })).toContain("12K+");
	});
});
