import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("@ui/modules/core/primitives/Button", () => ({
	Button: ({ children }: { children: ReactNode }) => <>{children}</>,
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

	it("sends the call to action into the planner", async () => {
		await renderCta();

		expect(screen.getByRole("link", { name: closing.cta }).getAttribute("href")).toBe("/planner");
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
