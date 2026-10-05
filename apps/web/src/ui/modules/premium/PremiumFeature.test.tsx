import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const premiumState = {
	premiumKey: null as string | null,
	showPremiumModal: vi.fn(),
	checkExistingSession: vi.fn(),
};

vi.mock("@application/stores/premium", async (importOriginal) => ({
	...(await importOriginal<typeof import("@application/stores/premium")>()),
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
}));

import { PremiumFeatureId, PremiumOrigin } from "@application/stores/premium";
import { PremiumFeature } from "./PremiumFeature";

interface RenderGateParams {
	locale: Locale;
	messages: object;
	origin?: PremiumOrigin;
}

const renderGate = ({ locale, messages, origin = PremiumOrigin.PLANNER }: RenderGateParams) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<PremiumFeature feature={PremiumFeatureId.CALENDAR_EXPORT} origin={origin}>
				<span>the export buttons</span>
			</PremiumFeature>
		</NextIntlClientProvider>,
	);

beforeEach(() => {
	premiumState.premiumKey = null;
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

const DESCRIPTION = "Add holidays your company closes for.";

const renderDescribedGate = () => {
	const errors = vi.spyOn(console, "error");
	const view = render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<PremiumFeature
				feature={PremiumFeatureId.CUSTOM_HOLIDAYS}
				origin={PremiumOrigin.PLANNER}
				description={DESCRIPTION}
			>
				<span>the custom tab</span>
			</PremiumFeature>
		</NextIntlClientProvider>,
	);
	const lock = view.container.querySelector<HTMLElement>('[data-slot="tooltip-trigger"]');
	if (!lock) throw new Error("the described gate drew no lock");
	return { ...view, errors, lock };
};

describe("PremiumFeature's lock, the one that carries the description", () => {
	it("is a native button, so Base UI finds the element its trigger expects and says nothing", () => {
		const { errors, lock } = renderDescribedGate();

		expect(lock.tagName).toBe("BUTTON");
		expect(errors.mock.calls.flat().join(" ")).not.toContain("Base UI");
	});

	it("stays out of the tab order, so the gate is the one stop and the one name a keyboard meets", () => {
		const { container, lock } = renderDescribedGate();
		const stops = [...container.querySelectorAll<HTMLElement>("button, [tabindex]")].filter((el) => el.tabIndex >= 0);

		expect(lock.tabIndex).toBe(-1);
		expect(stops.map((el) => el.getAttribute("aria-label"))).toEqual([DESCRIPTION]);
	});

	it("opens the modal once when the lock is clicked", () => {
		const { lock } = renderDescribedGate();

		fireEvent.click(lock);

		expect(premiumState.showPremiumModal).toHaveBeenCalledExactlyOnceWith({
			feature: "customHolidays",
			origin: "planner",
		});
	});

	it("opens the modal once when Enter is pressed on the lock, which a click had focused", () => {
		const { lock } = renderDescribedGate();
		lock.focus();

		fireEvent.keyDown(lock, { key: "Enter" });

		expect(premiumState.showPremiumModal).toHaveBeenCalledExactlyOnceWith({
			feature: "customHolidays",
			origin: "planner",
		});
	});
});

describe("PremiumFeature", () => {
	it("opens the modal with the gate id, which is what analytics receives", () => {
		renderGate({ locale: "en", messages: enMessages });

		fireEvent.click(screen.getByRole("button"));

		expect(premiumState.showPremiumModal).toHaveBeenCalledWith({ feature: "calendarExport", origin: "planner" });
	});

	it("hands the store the origin the gate was given, so the homepage dialog reports itself", () => {
		renderGate({ locale: "en", messages: enMessages, origin: PremiumOrigin.QUICK_START });

		fireEvent.click(screen.getByRole("button"));

		expect(premiumState.showPremiumModal).toHaveBeenCalledWith({ feature: "calendarExport", origin: "quick_start" });
	});

	it("sends the same id from a German render, so one gate is one value in the funnel", () => {
		renderGate({ locale: "de", messages: deMessages });

		fireEvent.click(screen.getByRole("button"));

		expect(premiumState.showPremiumModal).toHaveBeenCalledWith({ feature: "calendarExport", origin: "planner" });
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
