import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

import { Comparison } from "./Comparison";

const comparison = enMessages.homepage.comparison;

const renderComparison = async () => {
	mockGetTranslations.mockResolvedValue(
		createTranslator({ locale: "en", messages: enMessages, namespace: "homepage" }),
	);
	render(await Comparison());
	return screen.getAllByRole("list");
};

const itemsOf = (list: HTMLElement) => [...list.querySelectorAll("li")].map((item) => item.textContent ?? "");

describe("Comparison", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("marks every 'without' item with a cross and every 'with' item with a tick", async () => {
		const [without, withApp] = await renderComparison();

		expect(itemsOf(without).every((text) => text.startsWith("✗"))).toBe(true);
		expect(itemsOf(withApp).every((text) => text.startsWith("✓"))).toBe(true);
	});

	it("lists every translated pain point and every translated gain, in the bundle's order", async () => {
		const [without, withApp] = await renderComparison();

		expect(itemsOf(without).map((text) => text.slice(1))).toEqual(Object.values(comparison.withoutItems));
		expect(itemsOf(withApp).map((text) => text.slice(1))).toEqual(Object.values(comparison.withItems));
	});

	it("titles both columns from the bundle, so the emoji travel with the translation", async () => {
		await renderComparison();

		expect(screen.getByRole("heading", { level: 3, name: comparison.withoutTitle })).toBeDefined();
		expect(screen.getByRole("heading", { level: 3, name: comparison.withTitle })).toBeDefined();
	});
});
