import { PAYMENT_SUCCEEDED } from "@domain/payment/events/types";
import { TursoService } from "@infrastructure/clients/db/turso/service";
import { DatabaseError } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentChargeData } from "./repository";

const { savePayment, updatePaymentStatus, updatePaymentCharge, getPaymentById, getSucceededPaymentByEmail } =
	await import("./repository");

const mockExecute = vi.fn();
const mockQuery = vi.fn();

const MockTursoLayer = Layer.succeed(TursoService, {
	execute: mockExecute,
	query: mockQuery,
});

const runEffect = <A>(effect: Effect.Effect<A, DatabaseError, TursoService>) =>
	Effect.runPromise(effect.pipe(Effect.provide(MockTursoLayer)));

const runFlipEffect = (effect: Effect.Effect<unknown, DatabaseError, TursoService>) =>
	Effect.runPromise(effect.pipe(Effect.provide(MockTursoLayer), Effect.flip));

const BASE_PAYMENT = {
	id: "pi_test",
	stripeCreatedAt: new Date("2024-01-15T10:00:00Z"),
	customerId: "cus_123",
	chargeId: "ch_123",
	email: "user@example.com",
	amount: 1000,
	currency: "eur",
	status: "succeeded",
	paymentMethodType: "card",
	description: "Donation",
	promoCode: null,
	userAgent: "Mozilla/5.0",
	ipAddress: "1.2.3.4",
};

const BASE_ROW = {
	id: "pi_test",
	stripe_created_at: "2024-01-15T10:00:00.000Z",
	stripe_customer_id: "cus_123",
	stripe_charge_id: "ch_123",
	email: "user@example.com",
	amount: 1000,
	currency: "eur",
	status: "succeeded",
	payment_method_type: "card",
	description: "Donation",
	receipt_url: "https://receipt.url",
	promo_code: null,
	user_agent: "Mozilla/5.0",
	ip_address: "1.2.3.4",
	country: "ES",
	customer_name: "Test User",
	postal_code: "08001",
	city: "Barcelona",
	state: null,
	payment_brand: "visa",
	payment_last4: "4242",
	fee_amount: 30,
	net_amount: 970,
	refunded_at: null,
	refund_reason: null,
	disputed_at: null,
	dispute_reason: null,
	parent_payment_id: null,
	origin: "https://forever-pto.com",
	created_at: "2024-01-15 10:00:00",
	updated_at: "2024-01-15 10:00:00",
};

const BASE_STORED_PAYMENT = {
	...BASE_PAYMENT,
	country: "ES",
	customerName: "Test User",
	postalCode: "08001",
	city: "Barcelona",
	state: null,
	paymentBrand: "visa",
	paymentLast4: "4242",
	feeAmount: 30,
	netAmount: 970,
	refundedAt: null,
	refundReason: null,
	disputedAt: null,
	disputeReason: null,
	parentPaymentId: null,
	origin: "https://forever-pto.com",
};

beforeEach(() => {
	vi.clearAllMocks();
	mockExecute.mockReturnValue(Effect.succeed(undefined));
	mockQuery.mockReturnValue(Effect.succeed([]));
});

const insertedColumns = (sql: string) => {
	const list = sql.slice(sql.indexOf("(") + 1, sql.indexOf(") VALUES"));
	return list
		.split(",")
		.map((column) => column.trim())
		.filter((column) => column !== "created_at" && column !== "updated_at");
};

const updatedColumns = (sql: string) => [
	...sql
		.slice(0, sql.indexOf("WHERE"))
		.matchAll(/(\w+) = \?/g)
		.map(([, column]) => column),
	"id",
];

interface BoundRowParams {
	columns: string[];
	args: unknown[];
}

const boundRow = ({ columns, args }: BoundRowParams) =>
	Object.fromEntries(columns.map((column, index) => [column, args[index]]));

describe("savePayment", () => {
	it("executes an INSERT INTO payments", async () => {
		await runEffect(savePayment(BASE_PAYMENT));
		expect(mockExecute).toHaveBeenCalledOnce();
		const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(sql).toContain("INSERT OR IGNORE INTO payments");
	});

	it("binds exactly one value per placeholder", async () => {
		await runEffect(savePayment(BASE_PAYMENT));
		const [sql, args] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(sql.split("?")).toHaveLength(args.length + 1);
		expect(insertedColumns(sql)).toHaveLength(args.length);
	});

	it("binds every value under the column the INSERT names at that position", async () => {
		await runEffect(savePayment(BASE_PAYMENT));
		const [sql, args] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(boundRow({ columns: insertedColumns(sql), args })).toEqual({
			id: "pi_test",
			stripe_created_at: "2024-01-15T10:00:00.000Z",
			stripe_customer_id: "cus_123",
			stripe_charge_id: "ch_123",
			email: "user@example.com",
			amount: 1000,
			currency: "eur",
			status: "succeeded",
			payment_method_type: "card",
			description: "Donation",
			receipt_url: null,
			promo_code: null,
			user_agent: "Mozilla/5.0",
			ip_address: "1.2.3.4",
			country: null,
			customer_name: null,
			postal_code: null,
			city: null,
			state: null,
			payment_brand: null,
			payment_last4: null,
			fee_amount: null,
			net_amount: null,
			refunded_at: null,
			refund_reason: null,
			disputed_at: null,
			dispute_reason: null,
			parent_payment_id: null,
			origin: null,
		});
	});

	it("passes null for optional fields when they are null", async () => {
		await runEffect(savePayment({ ...BASE_PAYMENT, customerId: null, chargeId: null, promoCode: null }));
		const [sql, args] = mockExecute.mock.calls[0] as [string, unknown[]];
		const row = boundRow({ columns: insertedColumns(sql), args });
		expect(row.stripe_customer_id).toBeNull();
		expect(row.stripe_charge_id).toBeNull();
		expect(row.promo_code).toBeNull();
	});

	it("propagates DatabaseError when execute fails", async () => {
		mockExecute.mockReturnValue(Effect.fail(new DatabaseError({ message: "insert failed" })));
		const error = await runFlipEffect(savePayment(BASE_PAYMENT));
		expect(error).toBeInstanceOf(DatabaseError);
	});
});

describe("updatePaymentStatus", () => {
	it("executes an UPDATE payments SET status", async () => {
		await runEffect(updatePaymentStatus({ paymentIntentId: "pi_test", status: "succeeded" }));
		const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(sql).toContain("UPDATE payments");
		expect(sql).toContain("SET status");
	});

	it("refuses to overwrite a succeeded row, in the WHERE clause rather than at the caller", async () => {
		await runEffect(updatePaymentStatus({ paymentIntentId: "pi_test", status: "canceled" }));
		const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
		const where = sql.slice(sql.indexOf("WHERE"));

		expect(where).toContain("status != 'succeeded'");
	});

	it("answers whether it wrote, so no caller has to read the row first", async () => {
		mockExecute.mockReturnValueOnce(Effect.succeed(0));
		await expect(runEffect(updatePaymentStatus({ paymentIntentId: "pi_test", status: "canceled" }))).resolves.toBe(
			false,
		);

		mockExecute.mockReturnValueOnce(Effect.succeed(1));
		await expect(runEffect(updatePaymentStatus({ paymentIntentId: "pi_test", status: "canceled" }))).resolves.toBe(
			true,
		);
	});

	it("passes status and paymentIntentId as arguments", async () => {
		await runEffect(updatePaymentStatus({ paymentIntentId: "pi_test", status: "succeeded" }));
		const [, args] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(args[0]).toBe("succeeded");
		expect(args[2]).toBe("pi_test");
	});

	it("stamps succeeded_at against the same literal the domain calls the entitlement", async () => {
		await runEffect(updatePaymentStatus({ paymentIntentId: "pi_test", status: PAYMENT_SUCCEEDED }));
		const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(sql).toContain(`WHEN ? = '${PAYMENT_SUCCEEDED}'`);
	});

	it("propagates DatabaseError when execute fails", async () => {
		mockExecute.mockReturnValue(Effect.fail(new DatabaseError({ message: "update failed" })));
		const error = await runFlipEffect(updatePaymentStatus({ paymentIntentId: "pi_test", status: "succeeded" }));
		expect(error).toBeInstanceOf(DatabaseError);
	});
});

describe("updatePaymentCharge", () => {
	const chargeData: PaymentChargeData = {
		paymentIntentId: "pi_test",
		chargeId: "ch_abc",
		receiptUrl: "https://receipt.url",
		paymentMethodType: "card",
		country: "ES",
		customerName: "Test User",
		postalCode: "08001",
		city: "Barcelona",
		state: null,
		paymentBrand: "visa",
		paymentLast4: "4242",
		feeAmount: 30,
		netAmount: 970,
	};

	it("executes an UPDATE payments SET stripe_charge_id", async () => {
		await runEffect(updatePaymentCharge(chargeData));
		const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(sql).toContain("UPDATE payments");
		expect(sql).toContain("stripe_charge_id");
	});

	it("binds every value under the column the SET clause assigns it to", async () => {
		await runEffect(updatePaymentCharge(chargeData));
		const [sql, args] = mockExecute.mock.calls[0] as [string, unknown[]];
		expect(sql.split("?")).toHaveLength(args.length + 1);
		expect(boundRow({ columns: updatedColumns(sql), args })).toEqual({
			stripe_charge_id: "ch_abc",
			receipt_url: "https://receipt.url",
			payment_method_type: "card",
			country: "ES",
			customer_name: "Test User",
			postal_code: "08001",
			city: "Barcelona",
			state: null,
			payment_brand: "visa",
			payment_last4: "4242",
			fee_amount: 30,
			net_amount: 970,
			id: "pi_test",
		});
	});

	it("propagates DatabaseError when execute fails", async () => {
		mockExecute.mockReturnValue(Effect.fail(new DatabaseError({ message: "update failed" })));
		const error = await runFlipEffect(updatePaymentCharge(chargeData));
		expect(error).toBeInstanceOf(DatabaseError);
	});
});

describe("getPaymentById", () => {
	it("queries payments by id", async () => {
		await runEffect(getPaymentById("pi_test"));
		const [sql, args] = mockQuery.mock.calls[0] as [string, unknown[]];
		expect(sql).toContain("WHERE id = ?");
		expect(args[0]).toBe("pi_test");
	});

	it("maps the snake_case row onto PaymentData", async () => {
		mockQuery.mockReturnValue(Effect.succeed([BASE_ROW]));
		const result = await runEffect(getPaymentById("pi_test"));
		expect(result).toEqual(BASE_STORED_PAYMENT);
	});

	it("converts the text timestamp columns to dates", async () => {
		mockQuery.mockReturnValue(
			Effect.succeed([{ ...BASE_ROW, refunded_at: "2024-02-01T09:30:00.000Z", disputed_at: null }]),
		);
		const result = await runEffect(getPaymentById("pi_test"));
		expect(result?.stripeCreatedAt).toEqual(new Date("2024-01-15T10:00:00.000Z"));
		expect(result?.refundedAt).toEqual(new Date("2024-02-01T09:30:00.000Z"));
		expect(result?.disputedAt).toBeNull();
	});

	it("returns undefined when no rows found", async () => {
		mockQuery.mockReturnValue(Effect.succeed([]));
		const result = await runEffect(getPaymentById("pi_unknown"));
		expect(result).toBeUndefined();
	});

	it("propagates DatabaseError when query fails", async () => {
		mockQuery.mockReturnValue(Effect.fail(new DatabaseError({ message: "query failed" })));
		const error = await runFlipEffect(getPaymentById("pi_test"));
		expect(error).toBeInstanceOf(DatabaseError);
	});
});

describe("getSucceededPaymentByEmail", () => {
	it("filters on the email column, which is the only key Premium is recoverable by", async () => {
		await runEffect(getSucceededPaymentByEmail("user@example.com"));
		const [sql, args] = mockQuery.mock.calls[0] as [string, unknown[]];
		expect(sql).toContain("WHERE lower(trim(email)) = ?");
		expect(sql).toContain("status = 'succeeded'");
		expect(sql).toContain("ORDER BY stripe_created_at DESC");
		expect(args[0]).toBe("user@example.com");
	});

	it("matches an address the payer retyped with different capitalisation or a stray space", async () => {
		await runEffect(getSucceededPaymentByEmail("  User@Example.COM "));
		const [, args] = mockQuery.mock.calls[0] as [string, unknown[]];
		expect(args[0]).toBe("user@example.com");
	});

	it("normalises the stored column too, so rows written before this held for the same payer", async () => {
		await runEffect(getSucceededPaymentByEmail("user@example.com"));
		const [sql] = mockQuery.mock.calls[0] as [string, unknown[]];
		expect(sql).not.toContain("WHERE email = ?");
	});

	it("maps the snake_case row onto PaymentData", async () => {
		mockQuery.mockReturnValue(Effect.succeed([BASE_ROW]));
		const result = await runEffect(getSucceededPaymentByEmail("user@example.com"));
		expect(result).toEqual(BASE_STORED_PAYMENT);
	});

	it("returns undefined when no rows found", async () => {
		const result = await runEffect(getSucceededPaymentByEmail("unknown@example.com"));
		expect(result).toBeUndefined();
	});

	it("propagates DatabaseError when query fails", async () => {
		mockQuery.mockReturnValue(Effect.fail(new DatabaseError({ message: "query failed" })));
		const error = await runFlipEffect(getSucceededPaymentByEmail("user@example.com"));
		expect(error).toBeInstanceOf(DatabaseError);
	});
});
