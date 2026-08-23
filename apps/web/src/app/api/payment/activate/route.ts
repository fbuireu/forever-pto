import { activateWithPayment } from "@application/use-cases/activatePremium";
import { activatePremiumRequest } from "@infrastructure/api/operations/activatePremium";
import { resolveClientIp } from "@infrastructure/api/operations/types";
import { localePath, resolveLocale } from "@infrastructure/i18n/utils/url";
import { ACTIVATION_FAILED, ACTIVATION_PARAM } from "@infrastructure/services/premium/activation";
import { setPremiumCookie } from "@infrastructure/services/premium/cookie";
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

const SUCCEEDED_REDIRECT_STATUS: Stripe.PaymentIntent.Status = "succeeded";

export async function GET(request: NextRequest) {
	const { searchParams, origin } = request.nextUrl;
	const paymentIntentId = searchParams.get("payment_intent");
	const clientSecret = searchParams.get("payment_intent_client_secret");
	const redirectStatus = searchParams.get("redirect_status");
	const requested = searchParams.get("locale");
	const locale = resolveLocale(requested);

	const destination = new URL(localePath({ locale, path: "/payment/confirmation" }), origin);
	if (paymentIntentId) destination.searchParams.set("payment_intent", paymentIntentId);

	const redirectTo = (activated: boolean) => {
		if (!activated) destination.searchParams.set(ACTIVATION_PARAM, ACTIVATION_FAILED);
		const response = NextResponse.redirect(destination);
		response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
		return response;
	};

	if (!paymentIntentId || !clientSecret) return redirectTo(false);
	if (redirectStatus && redirectStatus !== SUCCEEDED_REDIRECT_STATUS) return redirectTo(false);

	const { token } = await activatePremiumRequest(
		{ ipAddress: resolveClientIp(request.headers) },
		activateWithPayment({ paymentIntentId, clientSecret }),
	);

	if (!token) return redirectTo(false);

	const response = redirectTo(true);
	setPremiumCookie({ response, token });
	return response;
}
