import type { CapitalizeKeys } from "@const/types";

export const CONTACT_DETAILS: Record<CapitalizeKeys<string>, string> = {
	NAME: "",
	EMAIL_SUBJECT: "Web contact form submission",
	ENCODED_EMAIL_FROM: "",
	ENCODED_EMAIL_SELF: "",
} as const;

export const SOCIAL_NETWORKS: Record<CapitalizeKeys<string>, string> = {
	LINKEDIN: "",
	GITHUB: "",
} as const;
