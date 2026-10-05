import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { act, render, screen } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ui/modules/core/animate/text/Rotating", () => ({
	RotatingText: ({ text }: { text: string }) => <span data-testid="emoji">{text}</span>,
}));

vi.mock("../../legal-identity/Me", () => ({ Me: () => <span>Ferran</span> }));

vi.mock("../../Icon", () => ({ Icon: () => <svg role="presentation" /> }));

const { DevFooter } = await import("./DevFooter");

const BUNDLES: Record<string, typeof en> = {
	en,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderFooterParams {
	locale?: Locale;
	messages?: typeof en;
}

const renderFooter = ({ locale = "en", messages = en }: RenderFooterParams = {}) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<DevFooter />
		</NextIntlClientProvider>,
	);

const emoji = () => screen.getByTestId("emoji").textContent;

const ROTATION_MS = 3000;

beforeEach(() => {
	vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
	vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("the emoji it rotates", () => {
	it("picks one as soon as it mounts", () => {
		vi.spyOn(Math, "random").mockReturnValue(0.5);

		renderFooter();

		expect(emoji()).toBe("🌮");
	});

	it("picks another one every few seconds", () => {
		renderFooter();
		expect(emoji()).toBe("☕");

		vi.spyOn(Math, "random").mockReturnValue(0.99);
		act(() => {
			vi.advanceTimersByTime(ROTATION_MS);
		});

		expect(emoji()).toBe("💡");
	});

	it("stops rotating once the footer goes away", () => {
		const { unmount } = renderFooter();

		unmount();

		expect(vi.getTimerCount()).toBe(0);
	});
});

describe("the credit line", () => {
	const line = () => screen.getByTestId("emoji").parentElement as HTMLElement;

	it("reads as one sentence with the emoji and the author inside it", () => {
		renderFooter();

		expect(line().textContent).toBe("Made with ☕ by Ferran");
	});

	it.each(Object.entries(BUNDLES))(
		"renders the %s credit line with the emoji and the author in place",
		(locale, messages) => {
			renderFooter({ locale: locale as Locale, messages });

			expect(line().textContent).toContain("☕");
			expect(line().textContent).toContain("Ferran");
			expect(line().textContent).not.toMatch(/[<>{}]|devFooter\./);
		},
	);
});

describe("where it says the developer can be found", () => {
	it("links each network at the profile it names", () => {
		renderFooter();

		const links = screen.getAllByRole("link").map((link) => link.getAttribute("href"));

		expect(links).toStrictEqual([
			"https://github.com/fbuireu",
			"https://linkedin.com/in/ferran-buireu",
			"https://bsky.app/profile/fbuireu.bsky.social",
			"https://www.buymeacoffee.com/ferranbuireu",
		]);
	});

	it("names each link, since the icon inside it says nothing to a reader", () => {
		renderFooter();

		expect(screen.getByRole("link", { name: "Visit my github profile" })).toBeTruthy();
		expect(screen.getByRole("link", { name: "Visit my linkedin profile" })).toBeTruthy();
		expect(screen.getByRole("link", { name: "Visit my bluesky profile" })).toBeTruthy();
	});

	it("spells a name out in full rather than leaving the underscores in it", () => {
		renderFooter();

		expect(screen.getByRole("link", { name: "Visit my buy me a coffee profile" })).toBeTruthy();
	});

	it("opens every one of them away from the app, safely", () => {
		renderFooter();

		for (const link of screen.getAllByRole("link")) {
			expect(link.getAttribute("target")).toBe("_blank");
			expect(link.getAttribute("rel")).toBe("noopener noreferrer");
		}
	});
});
