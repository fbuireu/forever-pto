//import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/infrastructure/i18n/config/config.ts");

const nextConfig: NextConfig = {
	trailingSlash: false,
	experimental: {
		optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
	},
	compiler: {
		removeConsole: process.env.NODE_ENV === "production",
	},
	images: {
		unoptimized: true, // Para Cloudflare Pages
	},
	compress: true,
};

if (process.env.NODE_ENV === "development") {
	// await setupDevPlatform();
}

export default withNextIntl(nextConfig);
