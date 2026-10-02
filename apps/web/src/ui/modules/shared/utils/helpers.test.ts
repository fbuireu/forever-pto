import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { LOCALES, type LocaleCode } from "@infrastructure/i18n/locales";
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { getViewBoxFromSvg, resolveApiErrorMessage } from "./helpers";

const MESSAGES = {
	internal_error: "Something went wrong on our side. Please try again later.",
	email_required: "Please enter your email address.",
};

const t = createTranslator({ locale: "en", messages: { feature: { errors: MESSAGES } }, namespace: "feature" });

const shared = createTranslator({
	locale: "en",
	messages: { errors: { invalid_body: "We could not read that request." } },
	namespace: "errors",
});

describe("resolveApiErrorMessage", () => {
	it("translates a known machine code", () => {
		expect(resolveApiErrorMessage({ code: "internal_error", t, shared, fallback: "Failed" })).toBe(
			MESSAGES.internal_error,
		);
	});

	it("translates a Zod code the server sent back verbatim", () => {
		expect(resolveApiErrorMessage({ code: "email_required", t, shared, fallback: "Failed" })).toBe(
			MESSAGES.email_required,
		);
	});

	it("falls back rather than rendering an untranslated code", () => {
		expect(resolveApiErrorMessage({ code: "webhook_processing_failed", t, shared, fallback: "Failed" })).toBe("Failed");
	});

	it("falls back when there is no code at all", () => {
		expect(resolveApiErrorMessage({ code: undefined, t, shared, fallback: "Failed" })).toBe("Failed");
		expect(resolveApiErrorMessage({ code: "", t, shared, fallback: "Failed" })).toBe("Failed");
	});

	it("passes prose through, since Stripe has already localised it", () => {
		expect(resolveApiErrorMessage({ code: "Your card was declined.", t, shared, fallback: "Failed" })).toBe(
			"Your card was declined.",
		);
	});
});

const sharedBundle = createTranslator({ locale: "en", messages: en, namespace: "errors" });

describe("resolveApiErrorMessage against the shipped en.json bundle", () => {
	interface ResolveInParams {
		namespace: "contact" | "checkout";
		code: string;
	}

	const resolveIn = ({ namespace, code }: ResolveInParams) =>
		resolveApiErrorMessage({
			code,
			t: createTranslator({ locale: "en", messages: en, namespace }),
			shared: sharedBundle,
			fallback: "Failed",
		});

	it("resolves invalid_body from the shared base for both namespaces", () => {
		const expected = "We could not read that request. Please try again.";

		expect(resolveIn({ namespace: "contact", code: "invalid_body" })).toBe(expected);
		expect(resolveIn({ namespace: "checkout", code: "invalid_body" })).toBe(expected);
	});

	it("lets a namespace override the shared copy, which is the whole reason for the precedence", () => {
		expect(resolveIn({ namespace: "contact", code: "internal_error" })).toBe(
			"Something went wrong on our side. Please try again later.",
		);
		expect(resolveIn({ namespace: "checkout", code: "internal_error" })).toBe(
			"Something went wrong on our side. Your card has not been charged.",
		);
	});

	it("resolves rate_limit_exceeded on the payment path", () => {
		expect(resolveIn({ namespace: "checkout", code: "rate_limit_exceeded" })).toBe(
			"Too many attempts. Please wait a moment and try again.",
		);
	});

	it("leaves rate_limit_exceeded out of the contact namespace, which never rate-limits", () => {
		expect(resolveIn({ namespace: "contact", code: "rate_limit_exceeded" })).toBe("Failed");
	});
});

describe("resolveApiErrorMessage with the values a code carries", () => {
	const BUNDLES: Record<LocaleCode, typeof en> = {
		en,
		es: esMessages,
		ca: caMessages,
		it: itMessages,
		de: deMessages,
		fr: frMessages,
	};
	const VALUES = new Map([
		["name_too_short", { min: 3 }],
		["subject_too_short", { min: 6 }],
		["message_too_short", { min: 11 }],
	]);

	it.each(LOCALES)("states each bound it is handed in the %s contact errors", (locale) => {
		const resolve = (code: string) =>
			resolveApiErrorMessage({
				code,
				t: createTranslator({ locale, messages: BUNDLES[locale], namespace: "contact" }),
				shared: createTranslator({ locale, messages: BUNDLES[locale], namespace: "errors" }),
				fallback: "Failed",
				values: VALUES,
			});

		for (const [code, { min }] of VALUES) {
			const message = resolve(code);

			expect(message.match(/\d+/g)).toEqual([String(min)]);
			expect(message).not.toMatch(/[{}]|contact\./);
		}
	});
});

describe("getViewBoxFromSvg", () => {
	it("reads the viewBox attribute", () => {
		expect(getViewBoxFromSvg('<svg viewBox="0 0 32 32"></svg>')).toBe("0 0 32 32");
	});

	it("defaults when the attribute is absent", () => {
		expect(getViewBoxFromSvg("<svg></svg>")).toBe("0 0 24 24");
	});
});
