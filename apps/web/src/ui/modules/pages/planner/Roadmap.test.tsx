import en from "@i18n/messages/en.json";
import es from "@i18n/messages/es.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

interface RadialNavMockProps {
	items: { id: number; label: string }[];
	onActiveChange?: (id: number) => void;
	"aria-label"?: string;
}

interface FeatureListMockProps {
	features: { id: string; title: string; quarter?: string }[];
	categoryLabel: string;
	detailedViewLabel: string;
}

const ORPHAN_ID = 99;

vi.mock("@ui/modules/core/animate/components/RadialNav", () => ({
	RadialNav: ({ items, onActiveChange, ...rest }: RadialNavMockProps) => (
		<nav aria-label={rest["aria-label"]}>
			{items.map((item) => (
				<button key={item.id} type="button" onClick={() => onActiveChange?.(item.id)}>
					{item.label}
				</button>
			))}
			<button type="button" onClick={() => onActiveChange?.(ORPHAN_ID)}>
				orphan
			</button>
		</nav>
	),
}));

vi.mock("@ui/modules/core/animate/components/FeatureList", () => ({
	FeatureList: ({ features, categoryLabel, detailedViewLabel }: FeatureListMockProps) => (
		<section data-testid="features" data-category={categoryLabel}>
			<ul>
				{features.map((feature) => (
					<li key={feature.id} data-quarter={feature.quarter ?? ""}>
						{feature.title}
					</li>
				))}
			</ul>
			<span>{detailedViewLabel}</span>
		</section>
	),
}));

import { Roadmap } from "./Roadmap";

interface RenderRoadmapParams {
	locale?: Locale;
	messages?: typeof en;
}

const renderRoadmap = ({ locale = "en", messages = en }: RenderRoadmapParams = {}) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<Roadmap />
		</NextIntlClientProvider>,
	);

const listed = () => Array.from(screen.getByTestId("features").querySelectorAll("li"));

const pick = (label: string) => userEvent.click(screen.getByRole("button", { name: label }));

describe("Roadmap", () => {
	it("opens on the finished work, labelled as such beside the dial", () => {
		renderRoadmap();

		expect(screen.getByTestId("features").dataset.category).toBe(en.roadmap.completed);
		expect(listed().map((item) => item.textContent)).toContain(en.roadmap.features.corePtoCalculator);
		expect(screen.getByText(en.roadmap.selected).nextElementSibling?.textContent).toBe(en.roadmap.completed);
	});

	it("moves the list and the badge together when another category is chosen", async () => {
		renderRoadmap();

		await pick(en.roadmap.planned);

		const titles = listed().map((item) => item.textContent);
		expect(titles).toContain(en.roadmap.features.teamPlanning);
		expect(titles).not.toContain(en.roadmap.features.corePtoCalculator);
		expect(screen.getByTestId("features").dataset.category).toBe(en.roadmap.planned);
		expect(screen.getByText(en.roadmap.selected).nextElementSibling?.textContent).toBe(en.roadmap.planned);
	});

	it("dates every finished and scheduled item by quarter, and leaves the future undated", async () => {
		renderRoadmap();

		expect(listed().every((item) => /^Q[1-4] 20\d\d$/.test(item.dataset.quarter ?? ""))).toBe(true);

		await pick(en.roadmap.future);

		expect(listed().length).toBeGreaterThan(0);
		expect(listed().every((item) => item.dataset.quarter === "")).toBe(true);
	});

	it("falls back to the finished work rather than an empty page when the dial reports an id it does not own", async () => {
		renderRoadmap();

		await pick("orphan");

		expect(screen.getByTestId("features").dataset.category).toBe("Features");
		expect(listed().map((item) => item.textContent)).toContain(en.roadmap.features.corePtoCalculator);
		expect(screen.queryByText(en.roadmap.selected)).toBeNull();
	});

	it("names the dial for assistive tech", () => {
		renderRoadmap();

		expect(screen.getByRole("navigation", { name: en.a11y.radialNavigation })).toBeTruthy();
	});

	it("translates the categories and the features from the same bundle", () => {
		renderRoadmap({ locale: "es", messages: es });

		expect(screen.getByTestId("features").dataset.category).toBe(es.roadmap.completed);
		expect(listed().map((item) => item.textContent)).toContain(es.roadmap.features.corePtoCalculator);
	});
});
