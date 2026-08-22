import en from "@i18n/messages/en.json";
import { describe, expect, it } from "vitest";
import { getViewBoxFromSvg, resolveApiErrorMessage } from "./helpers";

const MESSAGES: Record<string, string> = {
	"errors.internal_error": "Something went wrong on our side. Please try again later.",
	"errors.email_required": "Please enter your email address.",
};

const t = {
	has: (key: string) => key in MESSAGES,
	raw: (key: string) => MESSAGES[key],
};

const SHARED_MESSAGES: Record<string, string> = { invalid_body: "We could not read that request." };

const shared = {
	has: (key: string) => key in SHARED_MESSAGES,
	raw: (key: string) => SHARED_MESSAGES[key],
};

describe("resolveApiErrorMessage", () => {
	it("translates a known machine code", () => {
		expect(resolveApiErrorMessage({ code: "internal_error", t, shared, fallback: "Failed" })).toBe(
			MESSAGES["errors.internal_error"],
		);
	});

	it("translates a Zod code the server sent back verbatim", () => {
		expect(resolveApiErrorMessage({ code: "email_required", t, shared, fallback: "Failed" })).toBe(
			MESSAGES["errors.email_required"],
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

const translatorOver = (scope: unknown) => {
	const lookup = (key: string) =>
		key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], scope);

	return { has: (key: string) => typeof lookup(key) === "string", raw: lookup };
};

const bundleTranslator = (namespace: "contact" | "checkout") => translatorOver(en[namespace]);
const sharedBundle = translatorOver(en.errors);

describe("resolveApiErrorMessage against the shipped en.json bundle", () => {
	const resolveIn = (namespace: "contact" | "checkout", code: string) =>
		resolveApiErrorMessage({ code, t: bundleTranslator(namespace), shared: sharedBundle, fallback: "Failed" });

	it("resolves invalid_body from the shared base for both namespaces", () => {
		const expected = "We could not read that request. Please try again.";

		expect(resolveIn("contact", "invalid_body")).toBe(expected);
		expect(resolveIn("checkout", "invalid_body")).toBe(expected);
	});

	it("lets a namespace override the shared copy, which is the whole reason for the precedence", () => {
		expect(resolveIn("contact", "internal_error")).toBe("Something went wrong on our side. Please try again later.");
		expect(resolveIn("checkout", "internal_error")).toBe(
			"Something went wrong on our side. Your card has not been charged.",
		);
	});

	it("resolves rate_limit_exceeded on the payment path", () => {
		expect(resolveIn("checkout", "rate_limit_exceeded")).toBe("Too many attempts. Please wait a moment and try again.");
	});

	it("leaves rate_limit_exceeded out of the contact namespace, which never rate-limits", () => {
		expect(resolveIn("contact", "rate_limit_exceeded")).toBe("Failed");
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
