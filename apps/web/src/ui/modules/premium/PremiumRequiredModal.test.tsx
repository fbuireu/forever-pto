import { PremiumFeatureId } from "@application/stores/premium";
import { useUIStore } from "@application/stores/ui";
import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
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
	useUIStore.setState(useUIStore.getInitialState());
	vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
	vi.useRealTimers();
});

describe("PremiumRequiredModal", () => {
	it("closes itself and opens the donation popover from its call to action", () => {
		const onClose = renderModal(vi.fn().mockResolvedValue(true));

		fireEvent.click(screen.getByRole("button", { name: enMessages.premium.becomePremium }));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(useUIStore.getState().donatePopoverOpen).toBe(true);
	});

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

	it("keeps naming the gated feature while the dialog animates closed, after the store has let it go", () => {
		const props = { open: true, onClose: vi.fn(), onVerifyEmail: vi.fn(), isLoading: false };
		const { rerender } = render(
			<NextIntlClientProvider locale="en" messages={enMessages}>
				<PremiumRequiredModal {...props} feature={PremiumFeatureId.CALENDAR_EXPORT} />
			</NextIntlClientProvider>,
		);

		rerender(
			<NextIntlClientProvider locale="en" messages={enMessages}>
				<PremiumRequiredModal {...props} feature={null} />
			</NextIntlClientProvider>,
		);

		expect(screen.getByText(enMessages.calendarExport.title)).toBeDefined();
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

const BUNDLES = { en: enMessages, es: esMessages, ca: caMessages, it: itMessages, de: deMessages, fr: frMessages };

describe("PremiumRequiredModal copy", () => {
	it.each(Object.entries(BUNDLES))(
		"puts the feature inside the %s sentence rather than in front of it",
		(_, messages) => {
			expect(messages.premiumModal.featureRequiresPremium).toContain("{feature}");
		},
	);

	it.each(Object.entries(BUNDLES))("renders the %s sentence whole, with the feature in bold", (locale, messages) => {
		render(
			<NextIntlClientProvider locale={locale as Locale} messages={messages}>
				<PremiumRequiredModal
					open
					onClose={vi.fn()}
					feature={PremiumFeatureId.CALENDAR_EXPORT}
					onVerifyEmail={vi.fn()}
					isLoading={false}
				/>
			</NextIntlClientProvider>,
		);
		const feature = screen.getByText(messages.calendarExport.title);
		const sentence = feature.parentElement?.textContent ?? "";

		expect(feature.tagName).toBe("STRONG");
		expect(sentence).toContain(messages.calendarExport.title);
		expect(sentence.length).toBeGreaterThan(messages.calendarExport.title.length + 3);
		expect(sentence).not.toMatch(/[<>{}]|premiumModal\./);
	});
});
