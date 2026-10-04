import ca from "@i18n/messages/ca.json";
import de from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import es from "@i18n/messages/es.json";
import fr from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
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

		fireEvent.click(screen.getByRole("button", { name: "Take a quick tour" }));

		expect(startTutorial).toHaveBeenCalledOnce();
	});

	it("offers no way out of the planner, only the tour", () => {
		renderSubtitle();

		expect(screen.queryByRole("link")).toBeNull();
	});

	it("reads the sentence and its tour link from one message, so a locale cannot mix languages mid-sentence", () => {
		const { container } = renderSubtitle({ locale: "es", messages: es });

		expect(container.textContent).toBe(
			"Empieza añadiendo tus días en la barra lateral y ajusta el resto. ¿Aún tienes dudas? Haz un recorrido rápido.",
		);
		expect(screen.getByRole("button").textContent).toBe("Haz un recorrido rápido");
	});

	it.each(Object.entries({ en, es, ca, it: itMessages, de, fr }))(
		"renders the %s sentence whole, with the tour inside it as a button",
		(locale, messages) => {
			const { container } = renderSubtitle({ locale: locale as Locale, messages });
			const tour = screen.getByRole("button").textContent ?? "";

			expect(tour.length).toBeGreaterThan(3);
			expect(container.textContent).toContain(`${tour}.`);
			expect(container.textContent?.length).toBeGreaterThan(tour.length + 20);
			expect(container.textContent).not.toMatch(/[<>{}]|planner\./);
		},
	);
});
