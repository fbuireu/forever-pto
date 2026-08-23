import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

const filtersState = { allowPastDays: false, setAllowPastDays: vi.fn() };
const premiumState = {
	premiumKey: null as string | null,
	showUpgradeModal: vi.fn(),
	checkExistingSession: vi.fn(),
};

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: typeof filtersState) => unknown) => selector(filtersState),
}));
vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
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
