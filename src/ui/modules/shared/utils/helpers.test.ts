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

describe("resolveApiErrorMessage", () => {
	it("translates a known machine code", () => {
		expect(resolveApiErrorMessage({ code: "internal_error", t, fallback: "Failed" })).toBe(
			MESSAGES["errors.internal_error"],
		);
	});

	it("translates a Zod code the server sent back verbatim", () => {
		expect(resolveApiErrorMessage({ code: "email_required", t, fallback: "Failed" })).toBe(
			MESSAGES["errors.email_required"],
		);
	});

	it("falls back rather than rendering an untranslated code", () => {
		expect(resolveApiErrorMessage({ code: "webhook_processing_failed", t, fallback: "Failed" })).toBe("Failed");
	});

	it("falls back when there is no code at all", () => {
		expect(resolveApiErrorMessage({ code: undefined, t, fallback: "Failed" })).toBe("Failed");
		expect(resolveApiErrorMessage({ code: "", t, fallback: "Failed" })).toBe("Failed");
	});

	it("passes prose through, since Stripe has already localised it", () => {
		expect(resolveApiErrorMessage({ code: "Your card was declined.", t, fallback: "Failed" })).toBe(
			"Your card was declined.",
		);
	});
});

const bundleTranslator = (namespace: "contact" | "checkout") => {
	const scope: unknown = en[namespace];
	const lookup = (key: string) =>
		key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], scope);

	return { has: (key: string) => typeof lookup(key) === "string", raw: lookup };
};

describe("resolveApiErrorMessage against the shipped en.json bundle", () => {
	it("resolves invalid_body in both namespaces a malformed body can reach", () => {
		const expected = "We could not read that request. Please try again.";

		expect(resolveApiErrorMessage({ code: "invalid_body", t: bundleTranslator("contact"), fallback: "Failed" })).toBe(
			expected,
		);
		expect(resolveApiErrorMessage({ code: "invalid_body", t: bundleTranslator("checkout"), fallback: "Failed" })).toBe(
			expected,
		);
	});

	it("resolves rate_limit_exceeded on the payment path", () => {
		expect(
			resolveApiErrorMessage({ code: "rate_limit_exceeded", t: bundleTranslator("checkout"), fallback: "Failed" }),
		).toBe("Too many attempts. Please wait a moment and try again.");
	});

	it("leaves rate_limit_exceeded out of the contact namespace, which never rate-limits", () => {
		expect(
			resolveApiErrorMessage({ code: "rate_limit_exceeded", t: bundleTranslator("contact"), fallback: "Failed" }),
		).toBe("Failed");
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
