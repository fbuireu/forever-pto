import enMessages from "@i18n/messages/en.json";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const premiumState = { premiumKey: null, userEmail: null, setEmail: vi.fn() };
const uiState = {
	donatePopoverOpen: false,
	donatePopoverIsOpening: false,
	setDonatePopoverOpen: vi.fn(),
	clearDonatePopoverOpening: vi.fn(),
};

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
}));
vi.mock("@application/stores/ui", () => ({
	useUIStore: (selector: (state: typeof uiState) => unknown) => selector(uiState),
}));
vi.mock("@application/shared/utils/clientLog", () => ({ logClientError: vi.fn() }));
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track: vi.fn() }));
vi.mock("@infrastructure/clients/payments/stripe/client", () => ({
	getStripeClientInstance: () => ({ getStripePromise: () => Promise.resolve(null) }),
}));
vi.mock("@stripe/react-stripe-js", () => ({ Elements: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@ui/adapters/payments/checkout", () => ({ initializePayment: vi.fn() }));
vi.mock("@ui/modules/premium/CheckoutForm", () => ({ CheckoutForm: () => null }));
vi.mock("@ui/modules/core/animate/icons/Star", () => ({ Star: () => null }));
vi.mock("@ui/modules/core/animate/base/Popover", () => ({
	Popover: ({ children }: { children: ReactNode }) => <>{children}</>,
	PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
	PopoverContent: () => null,
}));
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./DonationForm", () => ({ DonationForm: () => null }));
vi.mock("./donate.css", () => ({}));

import { Donate } from "./Donate";

const renderDonate = () =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<Donate />
		</NextIntlClientProvider>,
	);

const trigger = (container: HTMLElement) => container.querySelector(".donate-trigger") as HTMLElement;

describe("Donate trigger band", () => {
	it("lets taps through the fixed band it spans below md", () => {
		const { container } = renderDonate();
		expect(trigger(container).className).toContain("pointer-events-none");
	});

	it("keeps the button itself interactive inside that band", () => {
		const { container } = renderDonate();
		expect(trigger(container).querySelector(".donate-brutal")?.className).toContain("pointer-events-auto");
	});

	it("stays full-bleed below md and hugs its content from md up", () => {
		const { container } = renderDonate();
		expect(trigger(container).className).toContain("w-full");
		expect(trigger(container).className).toContain("md:w-auto");
	});
});
