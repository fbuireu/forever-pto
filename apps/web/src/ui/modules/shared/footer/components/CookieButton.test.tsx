import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { CookieButton } from "./CookieButton";

const renderButton = () =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<CookieButton />
		</NextIntlClientProvider>,
	);

describe("CookieButton", () => {
	it("asks the consent library to reopen its preferences through the event it listens for on window", () => {
		const onShowPreferences = vi.fn();
		window.addEventListener("cc:showPreferences", onShowPreferences);
		renderButton();

		fireEvent.click(screen.getByRole("button", { name: enMessages.footer.manageCookies }));

		expect(onShowPreferences).toHaveBeenCalledOnce();
		window.removeEventListener("cc:showPreferences", onShowPreferences);
	});
});
