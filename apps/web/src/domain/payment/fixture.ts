import { isPaymentIntentId, type PaymentIntentId } from "./paymentIntentId";

export const paymentIntentIdFixture = (value: string): PaymentIntentId => {
	if (!isPaymentIntentId(value)) throw new TypeError(`The fixture ${value} is not a payment intent id`);
	return value;
};
