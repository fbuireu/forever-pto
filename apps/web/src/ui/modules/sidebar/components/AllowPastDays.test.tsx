import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

const filtersState = { allowPastDays: false, setAllowPastDays: vi.fn() };
const premiumState = {
	premiumKey: null as string | null,
	showPremiumModal: vi.fn(),
	checkExistingSession: vi.fn(),
};

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: typeof filtersState) => unknown) => selector(filtersState),
}));
vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
	PremiumFeatureId: { ALLOW_PAST_DAYS: "allowPastDays" },
}));

import { AllowPastDays } from "./AllowPastDays";

const renderField = () =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<AllowPastDays />
		</NextIntlClientProvider>,
	);

describe("AllowPastDays", () => {
	it("names the control itself, so the name survives the Premium gate", () => {
		premiumState.premiumKey = null;
		renderField();

		expect(screen.getByLabelText(enMessages.sidebar.allowPastDays.title)).toBeDefined();
	});

	it("renders no label element, because the control it would name sits behind the gate", () => {
		premiumState.premiumKey = null;
		const { container } = renderField();

		expect(container.querySelectorAll("label")).toHaveLength(0);
	});

	it("keeps the same name once Premium is unlocked", () => {
		premiumState.premiumKey = "key";
		renderField();

		expect(screen.getByLabelText(enMessages.sidebar.allowPastDays.title)).toBeDefined();
	});
});

describe("AllowPastDays analytics", () => {
	it("reports the switch's new state once Premium lets it be flipped", () => {
		track.mockClear();
		premiumState.premiumKey = "key";
		renderField();

		fireEvent.click(screen.getByRole("switch", { name: enMessages.sidebar.allowPastDays.title }));

		expect(filtersState.setAllowPastDays).toHaveBeenCalledExactlyOnceWith(true);
		expect(track).toHaveBeenCalledExactlyOnceWith({
			event: "planning_input_changed",
			properties: { input: "allowPastDays", inputValue: true },
		});
	});
});
