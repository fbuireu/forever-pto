import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		cssChunking: true,
		inlineCss: true,
		viewTransition: true,
		webVitalsAttribution: ["FCP", "CLS", "TTFB", "FID", "LCP", "INP"],
	},
	trailingSlash: false,
	env: {},
};

export default nextConfig;
