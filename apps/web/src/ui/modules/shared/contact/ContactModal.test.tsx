import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

const premiumState = { setEmail: vi.fn(), userEmail: null };
const sendContactEmailAction = vi.fn();

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
}));
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track: vi.fn() }));
vi.mock("@infrastructure/actions/contact", () => ({ sendContactEmailAction }));

import { ContactModal } from "./ContactModal";

const INTERNAL_ERROR_MESSAGE = "Something went wrong on our side. Please try again later.";
const messagesWithErrors = {
	...enMessages,
	contact: { ...enMessages.contact, errors: { internal_error: INTERNAL_ERROR_MESSAGE } },
};

interface SubmitMessageParams {
	messages: object;
	onClose?: () => void;
}

const submitMessage = async ({ messages, onClose = vi.fn() }: SubmitMessageParams) => {
	render(
		<NextIntlClientProvider locale="en" messages={messages}>
			<ContactModal open onClose={onClose} />
		</NextIntlClientProvider>,
	);

	interface FillParams {
		placeholder: string;
		value: string;
	}

	const fill = ({ placeholder, value }: FillParams) =>
		fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

	fill({ placeholder: enMessages.contact.namePlaceholder, value: "Ada Lovelace" });
	fill({ placeholder: enMessages.contact.emailPlaceholder, value: "ada@example.com" });
	fill({ placeholder: enMessages.contact.subjectPlaceholder, value: "A question about Bridges" });
	fill({
		placeholder: enMessages.contact.messagePlaceholder,
		value: "How does the planner pick which Bridges to build?",
	});

	fireEvent.click(screen.getByText(enMessages.contact.sendMessage));
};

describe("ContactModal failure reporting", () => {
	it("renders the translated message for a machine code instead of the code itself", async () => {
		sendContactEmailAction.mockResolvedValue({ success: false, error: "internal_error" });

		await submitMessage({ messages: messagesWithErrors });

		await waitFor(() => expect(screen.getByText(INTERNAL_ERROR_MESSAGE)).toBeTruthy());
		expect(screen.queryByText("internal_error")).toBeNull();
	});

	it("does not remember the address when the send failed, which would reset the form under the user", async () => {
		premiumState.setEmail.mockClear();
		sendContactEmailAction.mockResolvedValue({ success: false, error: "internal_error" });

		await submitMessage({ messages: messagesWithErrors });

		await waitFor(() => expect(screen.getByText(INTERNAL_ERROR_MESSAGE)).toBeTruthy());
		expect(premiumState.setEmail).not.toHaveBeenCalled();
	});

	it("remembers the address once the message actually went out", async () => {
		premiumState.setEmail.mockClear();
		sendContactEmailAction.mockResolvedValue({ success: true });

		await submitMessage({ messages: messagesWithErrors });

		await waitFor(() => expect(premiumState.setEmail).toHaveBeenCalledWith("ada@example.com"));
	});

	it("falls back to the generic message when the code has no key of its own", async () => {
		sendContactEmailAction.mockResolvedValue({ success: false, error: "name_too_long" });

		await submitMessage({ messages: messagesWithErrors });

		await waitFor(() => expect(screen.getByText(enMessages.contact.failedToSend)).toBeTruthy());
	});

	it("shows the thrown error's own words when the action itself fails rather than answering", async () => {
		sendContactEmailAction.mockRejectedValue(new Error("Mailbox unavailable"));

		await submitMessage({ messages: messagesWithErrors });

		await waitFor(() => expect(screen.getByText("Mailbox unavailable")).toBeTruthy());
		expect(screen.getByText(enMessages.contact.errorTitle)).toBeTruthy();
	});

	it("falls back to the generic message when what was thrown is not an Error", async () => {
		sendContactEmailAction.mockRejectedValue("offline");

		await submitMessage({ messages: messagesWithErrors });

		await waitFor(() => expect(screen.getByText(enMessages.contact.failedToSend)).toBeTruthy());
	});
});

describe("ContactModal after a failure", () => {
	it("returns to the form on try again, with the previous failure cleared", async () => {
		sendContactEmailAction.mockResolvedValue({ success: false, error: "internal_error" });
		await submitMessage({ messages: messagesWithErrors });
		await waitFor(() => expect(screen.getByText(INTERNAL_ERROR_MESSAGE)).toBeTruthy());

		fireEvent.click(screen.getByRole("button", { name: enMessages.formButtons.tryAgain }));

		expect(screen.getByPlaceholderText(enMessages.contact.namePlaceholder)).toBeTruthy();
		expect(screen.queryByText(INTERNAL_ERROR_MESSAGE)).toBeNull();
	});

	it("hands the dialog back to its owner from the outcome panel's close button", async () => {
		const onClose = vi.fn();
		sendContactEmailAction.mockResolvedValue({ success: true });
		await submitMessage({ messages: messagesWithErrors, onClose });
		await waitFor(() => expect(screen.getByText(enMessages.contact.successTitle)).toBeTruthy());

		const outcomeClose = screen
			.getAllByRole("button", { name: enMessages.formButtons.close })
			.find((button) => button.getAttribute("data-slot") === "button");
		fireEvent.click(outcomeClose as HTMLElement);

		expect(onClose).toHaveBeenCalledOnce();
	});
});
