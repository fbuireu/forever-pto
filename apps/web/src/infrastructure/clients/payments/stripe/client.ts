import type { Stripe } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";

class StripeClient {
	private stripePromise: Promise<Stripe | null> | null = null;
	private readonly publishableKey: string;

	constructor(publishableKey: string) {
		this.publishableKey = publishableKey;
	}

	getStripePromise() {
		this.stripePromise ??= loadStripe(this.publishableKey).catch((error: unknown) => {
			this.stripePromise = null;
			throw error;
		});
		return this.stripePromise;
	}
}

let stripeClientInstance: StripeClient | null = null;

export const getStripeClientInstance = () => {
	if (!stripeClientInstance) {
		const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

		if (!publishableKey) {
			throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined");
		}

		stripeClientInstance = new StripeClient(publishableKey);
	}
	return stripeClientInstance;
};
