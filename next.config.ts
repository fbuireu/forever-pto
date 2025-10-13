//import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
import type { NextConfig } from "next";


const nextConfig: NextConfig = {
	trailingSlash: false,
	experimental: {
		cssChunking: true,
		inlineCss: true,
		viewTransition: true,
		webVitalsAttribution: ["FCP", "CLS", "TTFB", "FID", "LCP", "INP"],
	},
};

if (process.env.NODE_ENV === "development") {
	// await setupDevPlatform();
}

