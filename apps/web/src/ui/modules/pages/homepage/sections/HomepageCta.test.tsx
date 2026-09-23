import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@ui/modules/pages/homepage/quick-start/QuickStartTrigger", () => ({
	QuickStartTrigger: ({ children, source }: { children: ReactNode; source: string }) => (
		<button type="button" data-testid="quick-start-trigger" data-source={source}>
			{children}
		</button>
	),
}));
vi.mock("./CtaShapesClient", () => ({
	CtaShapesClient: (props: Record<string, string>) => (
		<ul>
			{Object.entries(props).map(([shape, label]) => (
				<li key={shape} data-shape={shape}>
					{label}
				</li>
			))}
		</ul>
	),
}));

import { HomepageCta } from "./HomepageCta";

const closing = enMessages.homepage.closing;

const renderCta = async () => {
	mockGetTranslations.mockResolvedValue(
		createTranslator({ locale: "en", messages: enMessages, namespace: "homepage" }),
	);
	return render(await HomepageCta());
};

describe("HomepageCta", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("opens the quick start from the call to action rather than linking straight into the planner", async () => {
		await renderCta();

		expect(screen.getByTestId("quick-start-trigger").getAttribute("data-source")).toBe("closing");
		expect(screen.getByTestId("quick-start-trigger").textContent).toBe(closing.cta);
		expect(screen.queryByRole("link", { name: closing.cta })).toBeNull();
	});

	it("hands the floating shapes their translated labels, one per shape", async () => {
		const { container } = await renderCta();
		const shapes = Object.fromEntries(
			[...container.querySelectorAll("[data-shape]")].map((item) => [
				item.getAttribute("data-shape"),
				item.textContent,
			]),
		);

		expect(shapes).toEqual(closing.shapes);
	});

	it("builds the title from its three parts with the emphasis in the middle", async () => {
		await renderCta();
		const heading = screen.getByRole("heading", { level: 2 });

		expect(heading.textContent).toBe(`${closing.titleStart} ${closing.titleEmphasis}${closing.titleEnd}`);
		expect(heading.querySelector("em")?.textContent).toBe(closing.titleEmphasis);
	});
});
