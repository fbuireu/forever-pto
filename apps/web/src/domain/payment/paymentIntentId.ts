declare const paymentIntentIdBrand: unique symbol;

export type PaymentIntentId = string & { readonly [paymentIntentIdBrand]: true };

const PAYMENT_INTENT_ID = /^pi_[A-Za-z0-9]+$/;

export const isPaymentIntentId = (value: unknown): value is PaymentIntentId =>
	typeof value === "string" && PAYMENT_INTENT_ID.test(value);
