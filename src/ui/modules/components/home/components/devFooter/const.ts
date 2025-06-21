import type { CapitalizeKeys } from "@const/types";
import {
	siBluesky as Bluesky,
	siBuymeacoffee as BuyMeCoffee,
	siGithub as Github,
	siKofi as Kofi,
	siX as X,
} from "simple-icons";
import type { BaseSocialNetworks } from "./types";

export const CONTACT_DETAILS: Record<CapitalizeKeys<string>, string> = {
	EMAIL_SUBJECT: "Web contact submission - Forever PTO",
	ENCODED_EMAIL_SELF: btoa(process.env.NEXT_PUBLIC_EMAIL_SELF),
} as const;

export const SOCIAL_NETWORKS: CapitalizeKeys<BaseSocialNetworks, true> = {
	GITHUB: {
		USERNAME: "fbuireu",
		BASE_URL: "https://github.com",
		ICON: Github,
	},
	BLUESKY: {
		USERNAME: "fbuireu.bsky.social",
		BASE_URL: "https://bsky.app/profile",
		ICON: Bluesky,
	},
	X: {
		USERNAME: "fbuireu",
		BASE_URL: "https://x.com",
		ICON: X,
	},
	BUY_ME_A_COFFEE: {
		USERNAME: "ferranbuireu",
		BASE_URL: "https://www.buymeacoffee.com",
		ICON: BuyMeCoffee,
	},
	KOFI: {
		USERNAME: "ferranbuireu",
		BASE_URL: "https://ko-fi.com",
		ICON: Kofi,
	},
} as const;
