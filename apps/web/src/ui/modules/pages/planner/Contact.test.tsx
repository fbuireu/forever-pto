import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { type ComponentType, lazy, Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

interface ContactModalMockProps {
	open: boolean;
	onClose: () => void;
}

vi.mock("./contact.css", () => ({}));
vi.mock("src/ui/modules/shared/contact/ContactModal", () => ({
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

const renderContact = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<Contact />
		</NextIntlClientProvider>,
	);

const modalState = async () => (await screen.findByTestId("contact-modal")).dataset.open;

afterEach(() => {
	globalThis.location.hash = "";
});

describe("Contact", () => {
	it("keeps the feedback form closed on an ordinary arrival", async () => {
		renderContact();

		expect(await modalState()).toBe("false");
	});

	it("opens the form from the inline button", async () => {
		renderContact();

		await userEvent.click(screen.getByRole("button", { name: en.roadmap.letsTalk }));

		expect(await modalState()).toBe("true");
	});

	it("closes it again through the form's own dismissal", async () => {
		renderContact();
		await userEvent.click(screen.getByRole("button", { name: en.roadmap.letsTalk }));

		await userEvent.click(await screen.findByRole("button", { name: "dismiss" }));

		expect(await modalState()).toBe("false");
	});

	it("opens the form on arrival when the address names #contact, which is what the footer links to", async () => {
		globalThis.location.hash = "#contact";

		renderContact();

		expect(await modalState()).toBe("true");
	});

	it("sends issue reports to GitHub in a new tab, without handing that tab the opener", () => {
		renderContact();

		const link = screen.getByRole("link", { name: en.roadmap.openIssue });

		expect(link.getAttribute("href")).toContain("github.com/fbuireu/forever-pto/issues/new");
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.getAttribute("rel")).toContain("noopener");
	});
});
