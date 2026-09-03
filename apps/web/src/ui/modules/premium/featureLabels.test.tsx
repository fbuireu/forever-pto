import { PremiumFeatureId } from "@application/stores/premium";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import { renderHook } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { usePremiumFeatureLabel } from "./featureLabels";

const MESSAGE_KEY_SHAPE = /^[A-Za-z]+(\.[A-Za-z]+)+$/;

interface LabelsParams {
	locale: Locale;
	messages: typeof enMessages;
}

const labels = ({ locale, messages }: LabelsParams) =>
	renderHook(() => usePremiumFeatureLabel(), {
		wrapper: ({ children }: { children: ReactNode }) => (
			<NextIntlClientProvider locale={locale} messages={messages}>
				{children}
			</NextIntlClientProvider>
		),
	}).result.current;

describe("usePremiumFeatureLabel", () => {
	it("resolves every gate id to copy rather than to the key it was looked up by", () => {
		const label = labels({ locale: "en", messages: enMessages });

		for (const feature of Object.values(PremiumFeatureId)) {
			const text = label(feature);
			expect(text.length).toBeGreaterThan(0);
			expect(text).not.toMatch(MESSAGE_KEY_SHAPE);
		}
	});

	it("gives every gate a label of its own, so two features never announce the same thing", () => {
		const label = labels({ locale: "en", messages: enMessages });
		const texts = Object.values(PremiumFeatureId).map(label);

		expect(new Set(texts).size).toBe(texts.length);
	});

	it("names the export gate with the title the export feature itself uses", () => {
		expect(labels({ locale: "en", messages: enMessages })(PremiumFeatureId.CALENDAR_EXPORT)).toBe(
			enMessages.calendarExport.title,
		);
	});

	it("follows the reader's language", () => {
		expect(labels({ locale: "de", messages: deMessages })(PremiumFeatureId.CALENDAR_EXPORT)).toBe(
			deMessages.calendarExport.title,
		);
	});
});
