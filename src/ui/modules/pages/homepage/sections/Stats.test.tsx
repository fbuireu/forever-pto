import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import { render } from "@testing-library/react";
import { createFormatter, createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());
const mockGetFormatter = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
	getFormatter: mockGetFormatter,
}));

import { Stats } from "./Stats";

const renderStats = async (locale: string, messages: typeof enMessages) => {
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
		expect(await renderStats("de", deMessages)).toContain("2,14×");
	});

	it("formats the multiplier with the English decimal separator", async () => {
		expect(await renderStats("en", enMessages)).toContain("2.14×");
	});

	it("takes the abbreviated plan count from the locale bundle", async () => {
		expect(await renderStats("de", deMessages)).toContain(deMessages.homepage.stats.plansValue);
		expect(await renderStats("en", enMessages)).toContain(enMessages.homepage.stats.plansValue);
	});
});
