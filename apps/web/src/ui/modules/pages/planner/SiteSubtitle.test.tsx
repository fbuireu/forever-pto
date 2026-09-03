import en from "@i18n/messages/en.json";
import es from "@i18n/messages/es.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { startTutorial } = vi.hoisted(() => ({ startTutorial: vi.fn() }));

vi.mock("@ui/hooks/useTutorial", () => ({ useTutorial: () => ({ startTutorial }) }));
vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children, href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
		<a href={href} {...rest}>
			{children}
		</a>
	),
}));

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

afterEach(() => {
	document.getElementById("faq")?.remove();
});

describe("SiteSubtitle", () => {
	it("starts the tour from the inline button", () => {
		renderSubtitle();

		fireEvent.click(screen.getByRole("button", { name: en.planner.quickTour }));

		expect(startTutorial).toHaveBeenCalledOnce();
	});

	it("points the FAQ link at the homepage anchor, which is where it lands from any other page", () => {
		renderSubtitle();

		expect(screen.getByRole("link", { name: en.planner.checkFaqs }).getAttribute("href")).toBe("/#faq");
	});

	it("scrolls to the FAQ in place when it is already on the page, instead of navigating away", () => {
		const faq = document.createElement("section");
		faq.id = "faq";
		faq.scrollIntoView = vi.fn();
		document.body.append(faq);
		renderSubtitle();

		const navigated = fireEvent.click(screen.getByRole("link", { name: en.planner.checkFaqs }));

		expect(faq.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
		expect(navigated).toBe(false);
	});

	it("lets the link navigate when there is no FAQ on the page to scroll to", () => {
		renderSubtitle();

		const navigated = fireEvent.click(screen.getByRole("link", { name: en.planner.checkFaqs }));

		expect(navigated).toBe(true);
	});

	it("reads its three parts from the same bundle, so a locale cannot mix languages mid-sentence", () => {
		const { container } = renderSubtitle({ locale: "es", messages: es });

		expect(container.textContent).toContain(es.planner.instructions);
		expect(container.textContent).toContain(`${es.planner.quickTour} ${es.planner.or} ${es.planner.checkFaqs}.`);
	});
});
