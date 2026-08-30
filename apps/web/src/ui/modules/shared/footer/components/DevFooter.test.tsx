import en from "@i18n/messages/en.json";
import { act, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ui/modules/core/animate/text/Rotating", () => ({
	RotatingText: ({ text }: { text: string }) => <span data-testid="emoji">{text}</span>,
}));

vi.mock("@ui/modules/pages/legal/Me", () => ({ Me: () => <span>Ferran</span> }));

vi.mock("@ui/modules/shared/Icon", () => ({ Icon: () => <svg role="presentation" /> }));

const { DevFooter } = await import("./DevFooter");

const renderFooter = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
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
