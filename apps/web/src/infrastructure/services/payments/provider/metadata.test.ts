import type StripeNode from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clampMetadata, donationMetadata, readDonationMetadata } from "./metadata";

interface IntentParams {
	metadata: Record<string, string>;
	receiptEmail?: string | null;
}

const intent = ({ metadata, receiptEmail = null }: IntentParams) =>
	({ metadata, receipt_email: receiptEmail }) as unknown as StripeNode.PaymentIntent;

describe("readDonationMetadata", () => {
	it.each([
		["metadata wins when both are present", { email: "meta@example.com" }, "receipt@example.com", "meta@example.com"],
		["falls back to receipt_email", {}, "receipt@example.com", "receipt@example.com"],
		["trims before deciding", { email: "  meta@example.com  " }, null, "meta@example.com"],
		["a blank metadata email is not an address", { email: "   " }, "receipt@example.com", "receipt@example.com"],
		["an empty metadata email is not an address", { email: "" }, "receipt@example.com", "receipt@example.com"],
	])("%s", (_, metadata, receiptEmail, expected) => {
		expect(readDonationMetadata(intent({ metadata, receiptEmail })).email).toBe(expected);
	});

	it("reports no address when neither yields one", () => {
		expect(readDonationMetadata(intent({ metadata: { email: "  " }, receiptEmail: null })).email).toBeUndefined();
	});

	it("normalises the three optional fields to null rather than undefined", () => {
		expect(readDonationMetadata(intent({ metadata: { email: "a@b.com" } }))).toEqual({
			email: "a@b.com",
			promoCode: null,
			userAgent: null,
			ipAddress: null,
		});
	});

	it("carries the three optional fields through when present", () => {
		const metadata = { email: "a@b.com", promoCode: "SUMMER", userAgent: "Firefox", ipAddress: "1.2.3.4" };
		expect(readDonationMetadata(intent({ metadata }))).toEqual({
			email: "a@b.com",
			promoCode: "SUMMER",
			userAgent: "Firefox",
			ipAddress: "1.2.3.4",
		});
	});
});

describe("clampMetadata", () => {
	it("cuts a value at the 500 characters Stripe accepts", () => {
		expect(clampMetadata("x".repeat(600))).toHaveLength(500);
	});

	it("turns an absent value into the empty string Stripe requires", () => {
		expect(clampMetadata(undefined)).toBe("");
		expect(clampMetadata(null)).toBe("");
	});
});

describe("donationMetadata", () => {
	const DISCOUNT = {
		type: "percent",
		value: 10,
		originalAmount: 10,
		finalAmount: 9,
		couponId: "coup_abc",
		couponName: "SAVE10",
	} as const;

	afterEach(() => {
		vi.useRealTimers();
	});

	it("is read back by readDonationMetadata, so the writer and the reader name the same keys", () => {
		const metadata = donationMetadata({
			email: "a@b.com",
			promoCode: "SAVE20",
			userAgent: "Firefox",
			ipAddress: "1.2.3.4",
			discountInfo: null,
		});

		expect(readDonationMetadata(intent({ metadata }))).toEqual({
			email: "a@b.com",
			promoCode: "SAVE20",
			userAgent: "Firefox",
			ipAddress: "1.2.3.4",
		});
	});

	it("writes the block Stripe keeps on the intent, stamped with the instant it was built", () => {
		vi.useFakeTimers({ now: new Date("2025-01-15T10:00:00.000Z"), toFake: ["Date"] });

		expect(donationMetadata({ email: "a@b.com", discountInfo: null })).toStrictEqual({
			type: "donation",
			email: "a@b.com",
			promoCode: "",
			userAgent: "",
			ipAddress: "",
			timestamp: "2025-01-15T10:00:00.000Z",
		});
	});

	it("adds the coupon and the discount as strings when a promotion code was applied", () => {
		vi.useFakeTimers({ now: new Date("2025-01-15T10:00:00.000Z"), toFake: ["Date"] });

		expect(donationMetadata({ email: "a@b.com", promoCode: "SAVE10", discountInfo: DISCOUNT })).toStrictEqual({
			type: "donation",
			email: "a@b.com",
			promoCode: "SAVE10",
			userAgent: "",
			ipAddress: "",
			couponId: "coup_abc",
			couponName: "SAVE10",
			originalAmount: "10.00",
			discountType: "percent",
			discountValue: "10",
			discountAmount: "1.00",
			timestamp: "2025-01-15T10:00:00.000Z",
		});
	});

	it("writes an unnamed coupon as the empty string Stripe requires", () => {
		const metadata = donationMetadata({ email: "a@b.com", discountInfo: { ...DISCOUNT, couponName: null } });

		expect(metadata.couponName).toBe("");
	});

	it("clamps the free text to the cap and leaves the address whole", () => {
		const email = `${"a".repeat(240)}@example.com`;
		const metadata = donationMetadata({
			email,
			promoCode: "P".repeat(900),
			userAgent: "U".repeat(900),
			ipAddress: "I".repeat(900),
			discountInfo: null,
		});

		expect(metadata.email).toBe(email);
		expect([metadata.promoCode, metadata.userAgent, metadata.ipAddress].map((value) => value?.length)).toEqual([
			500, 500, 500,
		]);
	});
});
