import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { CookieConsentDialog } from "./CookieConsentDialog";
import { COOKIE_SECTIONS } from "./config/config";

const renderDialog = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<CookieConsentDialog
				open
				onOpenChange={vi.fn()}
				analyticsEnabled
				onAnalyticsChange={vi.fn()}
				serviceStates={{ ga4: true, betterStack: false }}
				onServiceChange={vi.fn()}
				onAcceptAll={vi.fn()}
				onRejectAll={vi.fn()}
				onSave={vi.fn()}
			/>
		</NextIntlClientProvider>,
	);

const SERVICES = COOKIE_SECTIONS.flatMap((section) => section.services ?? []);

describe("CookieConsentDialog", () => {
	it("names every section switch after the section it turns off", () => {
		renderDialog();

		for (const section of COOKIE_SECTIONS) {
			expect(screen.getByRole("switch", { name: en.cookies[`${section.id}Cookies`] })).toBeTruthy();
		}
	});

	it("names every service switch after the service it turns off", () => {
		renderDialog();

		expect(SERVICES.length).toBeGreaterThan(0);
		for (const service of SERVICES) {
			expect(screen.getByRole("switch", { name: en.cookies[service.labelKey] })).toBeTruthy();
		}
	});

	it("leaves no switch nameless, whatever the config grows to", () => {
		renderDialog();

		const nameless = screen.getAllByRole("switch").filter((control) => {
			const ariaLabel = control.getAttribute("aria-label") ?? "";
			const id = control.getAttribute("id");
			return ariaLabel.length === 0 && !(id && document.querySelector(`label[for="${id}"]`));
		});

		expect(nameless).toEqual([]);
	});
});
