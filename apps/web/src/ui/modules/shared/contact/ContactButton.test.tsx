import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

type Loader = () => Promise<{ default: unknown }>;

const { dynamic, MockContactModal } = vi.hoisted(() => ({
	dynamic: { loader: undefined as Loader | undefined },
	MockContactModal: vi.fn().mockReturnValue(null),
}));

vi.mock("./ContactModal", () => ({ ContactModal: MockContactModal }));
vi.mock("next/dynamic", () => ({
	default: (loader: Loader) => {
		dynamic.loader = loader;
		return ({ open, onClose }: { open: boolean; onClose: () => void }) => (
			<div data-testid="contact-modal" data-open={String(open)}>
				<button type="button" onClick={onClose}>
					dismiss
				</button>
			</div>
		);
	},
}));

const { ContactButton } = await import("./ContactButton");

const renderButton = () =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<ContactButton />
		</NextIntlClientProvider>,
	);

const modalOpen = () => screen.getByTestId("contact-modal").getAttribute("data-open");

describe("ContactButton", () => {
	it("keeps the modal closed until asked, so the form is not on the page for every visitor", () => {
		renderButton();

		expect(modalOpen()).toBe("false");
	});

	it("opens the modal from the translated footer link", () => {
		renderButton();

		fireEvent.click(screen.getByRole("button", { name: enMessages.footer.contactUs }));

		expect(modalOpen()).toBe("true");
	});

	it("loads the real modal behind the split, so the form is not in the footer's bundle", async () => {
		renderButton();

		expect((await dynamic.loader?.())?.default).toBe(MockContactModal);
	});

	it("closes again when the modal hands control back", () => {
		renderButton();
		fireEvent.click(screen.getByRole("button", { name: enMessages.footer.contactUs }));

		fireEvent.click(screen.getByRole("button", { name: "dismiss" }));

		expect(modalOpen()).toBe("false");
	});
});
