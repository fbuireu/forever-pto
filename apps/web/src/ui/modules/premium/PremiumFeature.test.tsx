import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const premiumState = {
	premiumKey: null as string | null,
	showPremiumModal: vi.fn(),
	checkExistingSession: vi.fn(),
};

vi.mock("@application/stores/premium", async (importOriginal) => ({
	...(await importOriginal<typeof import("@application/stores/premium")>()),
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
}));

import { PremiumFeatureId } from "@application/stores/premium";
import { PremiumFeature } from "./PremiumFeature";

const renderGate = (locale: Locale, messages: object) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<PremiumFeature feature={PremiumFeatureId.CALENDAR_EXPORT}>
				<span>the export buttons</span>
			</PremiumFeature>
		</NextIntlClientProvider>,
	);

beforeEach(() => {
	premiumState.premiumKey = null;
	vi.clearAllMocks();
});

describe("PremiumFeature", () => {
	it("opens the modal with the gate id, which is what analytics receives", () => {
		renderGate("en", enMessages);

		fireEvent.click(screen.getByRole("button"));

		expect(premiumState.showPremiumModal).toHaveBeenCalledWith("calendarExport");
	});

	it("sends the same id from a German render, so one gate is one value in the funnel", () => {
		renderGate("de", deMessages);

		fireEvent.click(screen.getByRole("button"));

		expect(premiumState.showPremiumModal).toHaveBeenCalledWith("calendarExport");
	});

	it("still names itself in the reader's language, resolving the label from the id", () => {
		renderGate("de", deMessages);

		expect(
			screen.getByLabelText(deMessages.premium.unlockFeature.replace("{feature}", deMessages.calendarExport.title)),
		).toBeDefined();
	});
});
