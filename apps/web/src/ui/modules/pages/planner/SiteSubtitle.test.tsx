import en from "@i18n/messages/en.json";
import es from "@i18n/messages/es.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { startTutorial } = vi.hoisted(() => ({ startTutorial: vi.fn() }));

vi.mock("@ui/hooks/useTutorial", () => ({ useTutorial: () => ({ startTutorial }) }));

import { SiteSubtitle } from "./SiteSubtitle";

interface RenderSubtitleParams {
	locale?: Locale;
	messages?: typeof en;
}

const renderSubtitle = ({ locale = "en", messages = en }: RenderSubtitleParams = {}) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<SiteSubtitle />
		</NextIntlClientProvider>,
	);

beforeEach(() => startTutorial.mockClear());

describe("SiteSubtitle", () => {
	it("starts the tour from the inline button", () => {
		renderSubtitle();

		fireEvent.click(screen.getByRole("button", { name: en.planner.quickTour }));

		expect(startTutorial).toHaveBeenCalledOnce();
	});

	it("offers no way out of the planner, only the tour", () => {
		renderSubtitle();

		expect(screen.queryByRole("link")).toBeNull();
	});

	it("reads both parts from the same bundle, so a locale cannot mix languages mid-sentence", () => {
		const { container } = renderSubtitle({ locale: "es", messages: es });

		expect(container.textContent).toBe(`${es.planner.instructions} ${es.planner.quickTour}.`);
	});
});
