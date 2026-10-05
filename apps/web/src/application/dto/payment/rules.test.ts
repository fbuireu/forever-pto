import { PAYMENT_STATUSES, type ReportedPaymentStatus } from "@domain/payment/events/types";
import { describe, expect, it } from "vitest";
import { hasSucceeded, wasCharged } from "./rules";
import type { PaymentConfirmationDTO } from "./types";

const confirmationOf = (status: ReportedPaymentStatus): PaymentConfirmationDTO => ({
	id: "pi_test",
	status,
	amount: 5,
	currency: "EUR",
});

const NOT_CHARGED = ["canceled", "requires_payment_method"];

describe("hasSucceeded", () => {
	it("is true for the one status that settles a Donation", () => {
		expect(hasSucceeded(confirmationOf("succeeded"))).toBe(true);
	});

	it.each(PAYMENT_STATUSES.filter((status) => status !== "succeeded"))("is false while the payment is %s", (status) => {
		expect(hasSucceeded(confirmationOf(status))).toBe(false);
	});

	it("is false for a status Stripe adds that this app has not met", () => {
		expect(hasSucceeded(confirmationOf("requires_something_new"))).toBe(false);
	});
});

describe("wasCharged", () => {
	it.each(NOT_CHARGED)("is false when the payment ended %s, with no money taken", (status) => {
		expect(wasCharged(confirmationOf(status))).toBe(false);
	});

	it.each(PAYMENT_STATUSES.filter((status) => !NOT_CHARGED.includes(status)))(
		"is true while the payment is %s, since money may have moved",
		(status) => {
			expect(wasCharged(confirmationOf(status))).toBe(true);
		},
	);

	it("is true when no confirmation could be read, since the payer may have been charged", () => {
		expect(wasCharged(null)).toBe(true);
	});

	it("is true for a status Stripe adds that this app has not met", () => {
		expect(wasCharged(confirmationOf("requires_something_new"))).toBe(true);
	});
});
