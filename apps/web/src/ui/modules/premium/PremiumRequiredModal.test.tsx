import { PremiumFeatureId } from "@application/stores/premium";
import enMessages from "@i18n/messages/en.json";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PremiumRequiredModal } from "./PremiumRequiredModal";

const AUTO_CLOSE_MS = 5000;

const renderModal = (onVerifyEmail: (email: string) => Promise<boolean>) => {
	const onClose = vi.fn();

	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<PremiumRequiredModal
				open
				onClose={onClose}
				feature={PremiumFeatureId.CALENDAR_EXPORT}
				onVerifyEmail={onVerifyEmail}
				isLoading={false}
			/>
		</NextIntlClientProvider>,
	);

	return onClose;
};

const submitEmail = async () => {
	fireEvent.change(screen.getByPlaceholderText(enMessages.premiumModal.emailPlaceholder), {
		target: { value: "donor@example.com" },
	});
	fireEvent.click(screen.getByRole("button", { name: enMessages.premiumModal.verifyAccess }));
};

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
	vi.useRealTimers();
});

describe("PremiumRequiredModal", () => {
	it("names the gated feature in the reader's language", () => {
		renderModal(vi.fn().mockResolvedValue(true));

		expect(screen.getByText(enMessages.calendarExport.title)).toBeDefined();
	});

	it("renders the failure panel when the address is not on the list", async () => {
		renderModal(vi.fn().mockResolvedValue(false));

		await submitEmail();

		await waitFor(() => expect(screen.getByText(enMessages.premiumModal.emailNotFound)).toBeDefined());
		expect(screen.getByText(enMessages.premiumModal.accessDenied)).toBeDefined();
	});

	it("returns to the address form on try again, with the refusal gone", async () => {
		renderModal(vi.fn().mockResolvedValue(false));
		await submitEmail();
		await waitFor(() => expect(screen.getByText(enMessages.premiumModal.accessDenied)).toBeDefined());

		fireEvent.click(screen.getByRole("button", { name: enMessages.formButtons.tryAgain }));

		expect(screen.getByPlaceholderText(enMessages.premiumModal.emailPlaceholder)).toBeDefined();
		expect(screen.queryByText(enMessages.premiumModal.accessDenied)).toBeNull();
	});

	it("closes itself once the promised seconds have passed", async () => {
		const onClose = renderModal(vi.fn().mockResolvedValue(true));

		await submitEmail();
		await waitFor(() => expect(screen.getByText(enMessages.premiumModal.accessGranted)).toBeDefined());

		expect(onClose).not.toHaveBeenCalled();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(AUTO_CLOSE_MS);
		});

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("does not fire the auto-close after a manual close, which would shut the modal a second time", async () => {
		const onClose = renderModal(vi.fn().mockResolvedValue(true));

		await submitEmail();
		await waitFor(() => expect(screen.getByText(enMessages.premiumModal.accessGranted)).toBeDefined());

		const outcomeClose = screen.getAllByRole("button", { name: enMessages.formButtons.close }).at(-1);
		fireEvent.click(outcomeClose as HTMLElement);
		expect(onClose).toHaveBeenCalledTimes(1);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(AUTO_CLOSE_MS * 2);
		});

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
