import ca from "@i18n/messages/ca.json";
import de from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import es from "@i18n/messages/es.json";
import fr from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { type ComponentType, lazy, Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

interface ContactModalMockProps {
	open: boolean;
	onClose: () => void;
}

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("./contact.css", () => ({}));
vi.mock("@ui/modules/shared/contact/ContactModal", () => ({
	ContactModal: ({ open, onClose }: ContactModalMockProps) => (
		<div data-testid="contact-modal" data-open={String(open)}>
			<button type="button" onClick={onClose}>
				dismiss
			</button>
		</div>
	),
}));

vi.mock("next/dynamic", () => ({
	default: (loader: () => Promise<{ default: ComponentType<ContactModalMockProps> }>) => {
		const Lazy = lazy(loader);
		return (props: ContactModalMockProps) => (
			<Suspense fallback={null}>
				<Lazy {...props} />
			</Suspense>
		);
	},
}));

const { Contact } = await import("./Contact");

interface RenderContactParams {
	locale?: Locale;
	messages?: typeof en;
}

const renderContact = ({ locale = "en", messages = en }: RenderContactParams = {}) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<Contact />
		</NextIntlClientProvider>,
	);

const modalState = async () => (await screen.findByTestId("contact-modal")).dataset.open;

afterEach(() => {
	globalThis.location.hash = "";
});

describe("Contact", () => {
	it("keeps the feedback form unmounted on an ordinary arrival", () => {
		renderContact();

		expect(screen.queryByTestId("contact-modal")).toBeNull();
	});

	it("opens the form from the inline button", async () => {
		renderContact();

		await userEvent.click(screen.getByRole("button", { name: "Let's talk" }));

		expect(await modalState()).toBe("true");
	});

	it("closes it again through the form's own dismissal", async () => {
		renderContact();
		await userEvent.click(screen.getByRole("button", { name: "Let's talk" }));

		await userEvent.click(await screen.findByRole("button", { name: "dismiss" }));

		expect(await modalState()).toBe("false");
	});

	it("opens the form on arrival when the address names #contact", async () => {
		globalThis.location.hash = "#contact";

		renderContact();

		expect(await modalState()).toBe("true");
	});

	it("sends issue reports to GitHub in a new tab, without handing that tab the opener", () => {
		renderContact();

		const link = screen.getByRole("link", { name: "open an issue on GitHub" });

		expect(link.getAttribute("href")).toContain("github.com/fbuireu/forever-pto/issues/new");
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.getAttribute("rel")).toContain("noopener");
	});
});

describe("Contact analytics", () => {
	it("reports the form opened from the button as a click", async () => {
		track.mockClear();
		renderContact();

		await userEvent.click(screen.getByRole("button", { name: "Let's talk" }));

		expect(track).toHaveBeenCalledExactlyOnceWith({ event: "contact_opened", properties: { source: "click" } });
	});

	it("reports a form opened by the #contact hash as such, since nobody clicked", async () => {
		track.mockClear();
		globalThis.location.hash = "#contact";
		renderContact();

		expect(await modalState()).toBe("true");
		expect(track).toHaveBeenCalledExactlyOnceWith({ event: "contact_opened", properties: { source: "hash" } });
	});
});

describe("Contact prompt copy", () => {
	it("reads as one sentence, with the two ways in where the sentence puts them", () => {
		const { container } = renderContact();

		expect(container.querySelector("#contact")?.textContent).toContain(
			"Got an idea that would make your life easier? Let's talk or open an issue on GitHub",
		);
	});

	it.each(Object.entries({ en, es, ca, it: itMessages, de, fr }))(
		"renders the %s prompt whole, with the talk button and the issue link inside it",
		(locale, messages) => {
			const { container } = renderContact({ locale: locale as Locale, messages });
			const talk = screen.getByRole("button").textContent ?? "";
			const issue = screen.getByRole("link").textContent ?? "";
			const prompt = screen.getByRole("link").parentElement?.textContent ?? "";

			expect(talk.length).toBeGreaterThan(3);
			expect(issue).toContain("GitHub");
			expect(prompt.indexOf(talk)).toBeGreaterThan(10);
			expect(prompt.indexOf(issue)).toBeGreaterThan(prompt.indexOf(talk));
			expect(container.textContent).not.toMatch(/[<>{}]|roadmap\./);
		},
	);
});
