import type { DiscountInfo } from "@application/dto/payment/types";
import type { TursoService } from "@infrastructure/clients/db/turso/service";
import { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
import type { PromoCodeErrorCode } from "@infrastructure/errors";
import { PromoCodeError, PromoCodeErrors } from "@infrastructure/errors";
import { countPromoCodeRedemptions } from "@infrastructure/services/payments/repository";
import { Effect } from "effect";
import type Stripe from "stripe";

const MIN_FINAL_AMOUNT = 0.5;
const PAYMENT_CURRENCY: string = "eur";

const getCouponValidationError = (coupon: Stripe.Coupon): PromoCodeErrorCode | null => {
	if (!coupon.valid) return PromoCodeErrors.COUPON_INVALID;
	if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions)
		return PromoCodeErrors.USAGE_LIMIT_REACHED;
	if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) return PromoCodeErrors.COUPON_EXPIRED;
	if (coupon.amount_off && coupon.currency?.toLowerCase() !== PAYMENT_CURRENCY) return PromoCodeErrors.COUPON_INVALID;
	return null;
};

interface GetPromotionCodeValidationErrorParams {
	promotionCode: Stripe.PromotionCode;
	amount: number;
}

const getPromotionCodeValidationError = ({
	promotionCode,
	amount,
}: GetPromotionCodeValidationErrorParams): PromoCodeErrorCode | null => {
	if (promotionCode.active === false) return PromoCodeErrors.INVALID_OR_EXPIRED;
	if (promotionCode.expires_at && promotionCode.expires_at < Math.floor(Date.now() / 1000)) {
		return PromoCodeErrors.COUPON_EXPIRED;
	}
	if (promotionCode.max_redemptions && promotionCode.times_redeemed >= promotionCode.max_redemptions) {
		return PromoCodeErrors.USAGE_LIMIT_REACHED;
	}

	const { minimum_amount: minimumAmount, minimum_amount_currency: minimumAmountCurrency } =
		promotionCode.restrictions ?? {};
	const comparableCurrency = !minimumAmountCurrency || minimumAmountCurrency.toLowerCase() === PAYMENT_CURRENCY;
	if (minimumAmount && comparableCurrency && Math.round(amount * 100) < minimumAmount) {
		return PromoCodeErrors.MIN_AMOUNT_EXCEEDED;
	}

	return null;
};

const toCents = (value: number) => Math.round(value * 100) / 100;

interface CalculateFinalAmountParams {
	coupon: Stripe.Coupon;
	amount: number;
}

const calculateFinalAmount = ({ coupon, amount }: CalculateFinalAmountParams) => {
	if (coupon.percent_off) return toCents(amount * (1 - coupon.percent_off / 100));
	if (coupon.amount_off) return toCents(amount - coupon.amount_off / 100);
	return amount;
};

export interface ValidatePromoCodeParams {
	code: string;
	amount: number;
}

export const validatePromoCode = ({
	code,
	amount,
}: ValidatePromoCodeParams): Effect.Effect<DiscountInfo, PromoCodeError, StripeServerService | TursoService> =>
	Effect.gen(function* () {
		const stripe = yield* StripeServerService;

		const promotionCodes = yield* stripe.promotionCodes
			.list({ code: code.toUpperCase().trim(), active: true, limit: 1, expand: ["data.promotion.coupon"] })
			.pipe(Effect.mapError((e) => new PromoCodeError({ code: PromoCodeErrors.FAILED_TO_LOAD, message: e.message })));

		if (promotionCodes.data.length === 0) {
			return yield* Effect.fail(new PromoCodeError({ code: PromoCodeErrors.INVALID_OR_EXPIRED }));
		}

		const [promotionCode] = promotionCodes.data;
		const { coupon } = promotionCode.promotion;
		if (!coupon || typeof coupon === "string") {
			return yield* Effect.fail(new PromoCodeError({ code: PromoCodeErrors.FAILED_TO_LOAD }));
		}

		const validationError =
			getPromotionCodeValidationError({ promotionCode, amount }) ?? getCouponValidationError(coupon);
		if (validationError) return yield* Effect.fail(new PromoCodeError({ code: validationError }));

		if (promotionCode.max_redemptions) {
			const redemptions = yield* countPromoCodeRedemptions(code).pipe(Effect.catchAll(() => Effect.succeed(0)));
			if (redemptions >= promotionCode.max_redemptions) {
				return yield* Effect.fail(new PromoCodeError({ code: PromoCodeErrors.USAGE_LIMIT_REACHED }));
			}
		}

		const finalAmount = calculateFinalAmount({ coupon, amount });
		if (finalAmount < MIN_FINAL_AMOUNT) {
			return yield* Effect.fail(new PromoCodeError({ code: PromoCodeErrors.MIN_AMOUNT_EXCEEDED }));
		}

		return {
			type: coupon.percent_off ? "percent" : "fixed",
			value: coupon.percent_off ?? (coupon.amount_off ? coupon.amount_off / 100 : 0),
			originalAmount: amount,
			finalAmount,
			couponId: coupon.id,
			couponName: coupon.name,
		} satisfies DiscountInfo;
	});
