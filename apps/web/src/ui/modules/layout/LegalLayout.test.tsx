import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));

import { LegalLayout } from "./LegalLayout";

const renderLayout = async () => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale: "en", messages: enMessages, namespace: "legal" }));
	return render(
		await LegalLayout({
			title: "Terms of Service",
			lastUpdated: "1 January 2026",
			children: <p>the terms themselves</p>,
		}),
	);
};

describe("LegalLayout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the document title as the page's single top-level heading", async () => {
		await renderLayout();

		expect(screen.getAllByRole("heading", { level: 1 }).map((heading) => heading.textContent)).toEqual([
			"Terms of Service",
		]);
	});

	it("dates the document with the translated label around the date it was given", async () => {
		await renderLayout();

		expect(screen.getByText(enMessages.legal.lastUpdated.replace("{date}", "1 January 2026"))).toBeDefined();
	});

	it("renders the document body inside the prose container", async () => {
		const { container } = await renderLayout();

		expect(container.querySelector(".prose")?.textContent).toBe("the terms themselves");
	});
});
