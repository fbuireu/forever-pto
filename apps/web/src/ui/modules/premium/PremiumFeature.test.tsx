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

interface RenderGateParams {
	locale: Locale;
	messages: object;
}

const renderGate = ({ locale, messages }: RenderGateParams) =>
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
		renderGate({ locale: "en", messages: enMessages });

		fireEvent.click(screen.getByRole("button"));

		expect(premiumState.showPremiumModal).toHaveBeenCalledWith("calendarExport");
	});

	it("sends the same id from a German render, so one gate is one value in the funnel", () => {
		renderGate({ locale: "de", messages: deMessages });

		fireEvent.click(screen.getByRole("button"));

		expect(premiumState.showPremiumModal).toHaveBeenCalledWith("calendarExport");
	});

	it("keeps a focus ring, so tabbing onto a gated chart changes something on screen", () => {
		renderGate({ locale: "en", messages: enMessages });
		const gate = screen.getByRole("button").className;

		expect(gate).not.toContain("focus:outline-none");
		expect(gate).toContain("focus-visible:ring-[3px]");
	});

	it("still names itself in the reader's language, resolving the label from the id", () => {
		renderGate({ locale: "de", messages: deMessages });

		expect(
			screen.getByLabelText(deMessages.premium.unlockFeature.replace("{feature}", deMessages.calendarExport.title)),
		).toBeDefined();
	});
});
