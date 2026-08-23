import { TursoService } from "@infrastructure/clients/db/turso/service";
import { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
import { PromoCodeError, PromoCodeErrors } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { validatePromoCode } = await import("./promoCode");

const mockList = vi.fn();

const mockQuery = vi.fn((_sql: string, _args: unknown[]) => Effect.succeed([{ redemptions: 0 }]));

const MockTursoLayer = Layer.succeed(TursoService, {
	query: mockQuery,
	execute: vi.fn(),
} as never);

const MockStripeLayer = Layer.succeed(StripeServerService, {
	paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
	charges: { retrieve: vi.fn() },
	promotionCodes: { list: mockList },
	webhooks: { constructEvent: vi.fn() },
});

interface RunParams {
	code: string;
	amount: number;
}

const run = ({ code, amount }: RunParams) =>
	Effect.runPromise(
		validatePromoCode({ code, amount }).pipe(Effect.provide(Layer.mergeAll(MockStripeLayer, MockTursoLayer))),
	);

interface RunFlipParams {
	code: string;
	amount: number;
}

const runFlip = ({ code, amount }: RunFlipParams) =>
	Effect.runPromise(
		validatePromoCode({ code, amount }).pipe(
			Effect.provide(Layer.mergeAll(MockStripeLayer, MockTursoLayer)),
			Effect.flip,
		),
	);

type PromoCodeOverrides = Partial<{
	active: boolean;
	expires_at: number | null;
	max_redemptions: number | null;
	times_redeemed: number;
	restrictions: { minimum_amount: number | null; minimum_amount_currency: string | null };
}>;

const makePromoCode = (overrides: PromoCodeOverrides = {}) => ({
	id: "promo_abc",
	active: true,
	expires_at: null,
	max_redemptions: null,
	times_redeemed: 0,
	restrictions: { minimum_amount: null, minimum_amount_currency: null },
	...overrides,
});

const makeCoupon = (
	overrides: Partial<{
		valid: boolean;
		max_redemptions: number | null;
		times_redeemed: number;
		redeem_by: number | null;
		percent_off: number | null;
		amount_off: number | null;
		currency: string | null;
		name: string | null;
	}> = {},
) => ({
	id: "coup_abc",
	valid: true,
	max_redemptions: null,
	times_redeemed: 0,
	redeem_by: null,
	percent_off: 10,
	amount_off: null,
	currency: "eur",
	name: "SAVE10",
	...overrides,
});

beforeEach(() => {
	vi.clearAllMocks();
});

interface SetupMocksParams {
	coupon: ReturnType<typeof makeCoupon>;
	promoCodeOverrides?: PromoCodeOverrides;
}

const setupMocks = ({ coupon, promoCodeOverrides = {} }: SetupMocksParams) => {
	const promotionCode = makePromoCode(promoCodeOverrides);
	mockList.mockReturnValue(Effect.succeed({ data: [{ ...promotionCode, promotion: { type: "coupon", coupon } }] }));
};

describe("validatePromoCode", () => {
	describe("successful validation", () => {
		it("returns DiscountInfo with percent discount", async () => {
			setupMocks({ coupon: makeCoupon({ percent_off: 10, amount_off: null }) });
			const result = await run({ code: "SAVE10", amount: 10 });
			expect(result).toMatchObject({
				type: "percent",
				value: 10,
				originalAmount: 10,
				finalAmount: 9,
				couponId: "coup_abc",
				couponName: "SAVE10",
			});
		});

		it("leaves a percentage discount alone, since a percentage has no currency to disagree about", async () => {
			setupMocks({ coupon: makeCoupon({ percent_off: 10, amount_off: null, currency: "usd" }) });
			const result = await run({ code: "SAVE10", amount: 10 });
			expect(result).toMatchObject({ type: "percent", finalAmount: 9 });
		});

		it("returns DiscountInfo with fixed amount discount", async () => {
			setupMocks({ coupon: makeCoupon({ percent_off: null, amount_off: 200 }) });
			const result = await run({ code: "FIXED2", amount: 10 });
			expect(result).toMatchObject({
				type: "fixed",
				value: 2,
				originalAmount: 10,
				finalAmount: 8,
			});
		});

		it("uppercases and trims the promo code before listing", async () => {
			setupMocks({ coupon: makeCoupon() });
			await run({ code: "  save10  ", amount: 10 });
			const [params] = mockList.mock.calls[0] as [{ code: string }];
			expect(params.code).toBe("SAVE10");
		});
	});

	describe("validation errors", () => {
		it("fails with INVALID_OR_EXPIRED when no promo codes are found", async () => {
			mockList.mockReturnValue(Effect.succeed({ data: [] }));
			const error = await runFlip({ code: "BADCODE", amount: 10 });
			expect(error).toBeInstanceOf(PromoCodeError);
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.INVALID_OR_EXPIRED);
		});

		it("refuses a fixed discount priced in another currency instead of subtracting it as euros", async () => {
			setupMocks({ coupon: makeCoupon({ percent_off: null, amount_off: 200, currency: "usd" }) });
			const error = await runFlip({ code: "FIXED2", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.COUPON_INVALID);
		});

		it("refuses a fixed discount with no currency at all, which cannot be compared", async () => {
			setupMocks({ coupon: makeCoupon({ percent_off: null, amount_off: 200, currency: null }) });
			const error = await runFlip({ code: "FIXED2", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.COUPON_INVALID);
		});

		it("counts redemptions in our own records, since Stripe never sees the code redeemed", async () => {
			setupMocks({ coupon: makeCoupon(), promoCodeOverrides: { max_redemptions: 1 } });
			mockQuery.mockReturnValueOnce(Effect.succeed([{ redemptions: 1 }]));

			const error = await runFlip({ code: "LAUNCH50", amount: 10 });

			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.USAGE_LIMIT_REACHED);
		});

		it("normalises the code on both sides of the count, since the table holds what the user typed", async () => {
			setupMocks({ coupon: makeCoupon(), promoCodeOverrides: { max_redemptions: 5 } });

			await run({ code: "  launch50  ", amount: 10 });

			const [, args] = mockQuery.mock.calls[0] ?? [];
			expect(args?.[0]).toBe("LAUNCH50");
		});

		it("still accepts the code while the cap has room left", async () => {
			setupMocks({ coupon: makeCoupon(), promoCodeOverrides: { max_redemptions: 3 } });
			mockQuery.mockReturnValueOnce(Effect.succeed([{ redemptions: 2 }]));

			await expect(run({ code: "LAUNCH50", amount: 10 })).resolves.toMatchObject({ finalAmount: 9 });
		});

		it("does not query at all when the code carries no cap", async () => {
			setupMocks({ coupon: makeCoupon(), promoCodeOverrides: { max_redemptions: null } });
			mockQuery.mockClear();

			await run({ code: "LAUNCH50", amount: 10 });

			expect(mockQuery).not.toHaveBeenCalled();
		});

		it("lets the code through when the count itself fails, rather than blocking a paying donor", async () => {
			setupMocks({ coupon: makeCoupon(), promoCodeOverrides: { max_redemptions: 1 } });
			mockQuery.mockReturnValueOnce(Effect.fail(new Error("db down")) as never);

			await expect(run({ code: "LAUNCH50", amount: 10 })).resolves.toMatchObject({ finalAmount: 9 });
		});

		it("fails with COUPON_INVALID when coupon is not valid", async () => {
			setupMocks({ coupon: makeCoupon({ valid: false }) });
			const error = await runFlip({ code: "BAD", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.COUPON_INVALID);
		});

		it("fails with USAGE_LIMIT_REACHED when max redemptions exceeded", async () => {
			setupMocks({ coupon: makeCoupon({ max_redemptions: 5, times_redeemed: 5 }) });
			const error = await runFlip({ code: "MAXED", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.USAGE_LIMIT_REACHED);
		});

		it("fails with COUPON_EXPIRED when redeem_by is in the past", async () => {
			setupMocks({ coupon: makeCoupon({ redeem_by: Math.floor(Date.now() / 1000) - 3600 }) });
			const error = await runFlip({ code: "EXPIRED", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.COUPON_EXPIRED);
		});

		it("fails with MIN_AMOUNT_EXCEEDED when finalAmount is below 0.50", async () => {
			setupMocks({ coupon: makeCoupon({ percent_off: 99, amount_off: null }) });
			const error = await runFlip({ code: "BIG", amount: 0.1 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.MIN_AMOUNT_EXCEEDED);
		});

		it("fails with MIN_AMOUNT_EXCEEDED when the amount is below the promotion code minimum", async () => {
			setupMocks({
				coupon: makeCoupon(),
				promoCodeOverrides: { restrictions: { minimum_amount: 2000, minimum_amount_currency: "eur" } },
			});
			const error = await runFlip({ code: "LAUNCH50", amount: 15 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.MIN_AMOUNT_EXCEEDED);
		});

		it("accepts an amount that meets the promotion code minimum", async () => {
			setupMocks({
				coupon: makeCoupon(),
				promoCodeOverrides: { restrictions: { minimum_amount: 2000, minimum_amount_currency: "eur" } },
			});
			await expect(run({ code: "LAUNCH50", amount: 20 })).resolves.toMatchObject({ finalAmount: 18 });
		});

		it("ignores a minimum priced in another currency", async () => {
			setupMocks({
				coupon: makeCoupon(),
				promoCodeOverrides: { restrictions: { minimum_amount: 2000, minimum_amount_currency: "usd" } },
			});
			await expect(run({ code: "LAUNCH50", amount: 15 })).resolves.toMatchObject({ finalAmount: 13.5 });
		});

		it("fails with USAGE_LIMIT_REACHED when the promotion code redemption cap is reached", async () => {
			setupMocks({ coupon: makeCoupon(), promoCodeOverrides: { max_redemptions: 100, times_redeemed: 100 } });
			const error = await runFlip({ code: "MAXED", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.USAGE_LIMIT_REACHED);
		});

		it("fails with COUPON_EXPIRED when the promotion code expires_at is in the past", async () => {
			setupMocks({ coupon: makeCoupon(), promoCodeOverrides: { expires_at: Math.floor(Date.now() / 1000) - 3600 } });
			const error = await runFlip({ code: "EXPIRED", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.COUPON_EXPIRED);
		});

		it("fails with INVALID_OR_EXPIRED when the promotion code is inactive", async () => {
			setupMocks({ coupon: makeCoupon(), promoCodeOverrides: { active: false } });
			const error = await runFlip({ code: "OFF", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.INVALID_OR_EXPIRED);
		});

		it("fails with FAILED_TO_LOAD when the promotion carries no coupon", async () => {
			mockList.mockReturnValue(
				Effect.succeed({ data: [{ ...makePromoCode(), promotion: { type: "coupon", coupon: null } }] }),
			);
			const error = await runFlip({ code: "NULL", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.FAILED_TO_LOAD);
		});

		it("fails with FAILED_TO_LOAD when the coupon came back unexpanded, as a bare id", async () => {
			mockList.mockReturnValue(
				Effect.succeed({ data: [{ ...makePromoCode(), promotion: { type: "coupon", coupon: "coup_abc" } }] }),
			);
			const error = await runFlip({ code: "BARE", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.FAILED_TO_LOAD);
		});

		it("fails with FAILED_TO_LOAD when list() rejects", async () => {
			mockList.mockReturnValue(
				Effect.fail(new PromoCodeError({ code: PromoCodeErrors.FAILED_TO_LOAD, message: "network error" })),
			);
			const error = await runFlip({ code: "ERR", amount: 10 });
			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.FAILED_TO_LOAD);
		});
	});

	describe("cent arithmetic", () => {
		it("leaves a percentage discount on a whole number of cents, not on float noise", async () => {
			setupMocks({ coupon: makeCoupon({ percent_off: 90, amount_off: null }) });

			await expect(run({ code: "SAVE90", amount: 10 })).resolves.toMatchObject({ finalAmount: 1 });
		});

		it("admits a discount landing exactly on the 0.50 floor", async () => {
			setupMocks({ coupon: makeCoupon({ percent_off: 90, amount_off: null }) });

			await expect(run({ code: "SAVE90", amount: 5 })).resolves.toMatchObject({ finalAmount: 0.5 });
		});
	});

	describe("the shape it asks Stripe for", () => {
		it("asks for the coupon expanded, since a promotion code carries only its id", async () => {
			setupMocks({ coupon: makeCoupon() });

			await run({ code: "SAVE10", amount: 10 });

			const [params] = mockList.mock.calls[0] as [{ expand?: string[] }];
			expect(params.expand).toEqual(["data.promotion.coupon"]);
		});

		it("reads the coupon from the promotion, which is where the API puts it", async () => {
			setupMocks({ coupon: makeCoupon({ percent_off: 25 }) });

			await expect(run({ code: "SAVE25", amount: 100 })).resolves.toMatchObject({
				type: "percent",
				value: 25,
				finalAmount: 75,
			});
		});

		it("never reaches for a top-level coupon field, which this API version does not send", async () => {
			const coupon = makeCoupon({ percent_off: 25 });
			mockList.mockReturnValue(
				Effect.succeed({ data: [{ ...makePromoCode(), coupon, promotion: { type: "coupon", coupon: null } }] }),
			);

			const error = await runFlip({ code: "SAVE25", amount: 100 });

			expect((error as PromoCodeError).code).toBe(PromoCodeErrors.FAILED_TO_LOAD);
		});
	});
});
