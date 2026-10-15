"use client";

import { getStripeClientInstance } from "@infrastructure/clients/payments/stripe/client";
import { useEffect } from "react";

export function StripePreload(): null {
	useEffect(() => {
		Promise.resolve()
			.then(() => getStripeClientInstance().getStripePromise())
			.catch(() => undefined);
	}, []);

	return null;
}
