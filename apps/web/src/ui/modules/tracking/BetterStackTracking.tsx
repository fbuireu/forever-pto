"use client";

import { usePremiumStore } from "@application/stores/premium";
import { identifyUser, trackingEnvironment } from "@infrastructure/clients/logging/better-stack/tracking";
import { BETTER_STACK_SERVICE_ID, isServiceConsented } from "@ui/modules/shared/cookie-consent/utils/consent";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { version } from "../../../../package.json";

const TRACKING_TOKEN = process.env.NEXT_PUBLIC_BETTER_STACK_TRACKING_TOKEN;

export const BetterStackTracking = () => {
	const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

	const { userEmail, premiumKey } = usePremiumStore(
		useShallow((state) => ({
			userEmail: state.userEmail,
			premiumKey: state.premiumKey,
		})),
	);

	useEffect(() => {
		const readConsent = () => {
			setAnalyticsEnabled(isServiceConsented(BETTER_STACK_SERVICE_ID));
		};

		readConsent();

		window.addEventListener("cc:onConsent", readConsent);
		window.addEventListener("cc:onChange", readConsent);

		return () => {
			window.removeEventListener("cc:onConsent", readConsent);
			window.removeEventListener("cc:onChange", readConsent);
		};
	}, []);

	useEffect(() => {
		if (!analyticsEnabled || !userEmail) return;
		identifyUser({ email: userEmail, plan: premiumKey ? "premium" : "free" });
	}, [analyticsEnabled, userEmail, premiumKey]);

	if (!TRACKING_TOKEN || !analyticsEnabled) return null;

	const environment = trackingEnvironment(window.location.hostname);

	return (
		<Script id="betterstack-tracking" strategy="afterInteractive">
			{`
        !function(b,e,t,r){
          b[t]=b[t]||function(){(b[t].q=b[t].q||[]).push(arguments)};
          b[t].l=+new Date;
          var s=e.createElement('script'); s.async=1; s.crossOrigin='anonymous';
          s.src='https://betterstack.net/b.js?t='+r;
          (e.head||e.getElementsByTagName('head')[0]).appendChild(s);
        }(window,document,'betterstack','${TRACKING_TOKEN}');
        betterstack('config', { release: '${version}' });
        betterstack('init', { environment: '${environment}' });
      `}
		</Script>
	);
};
