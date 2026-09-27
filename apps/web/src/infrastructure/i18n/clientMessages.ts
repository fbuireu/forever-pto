import type { AbstractIntlMessages } from "next-intl";

export const SERVER_ONLY_NAMESPACES = [
	"cookiePolicy",
	"faq",
	"homepage",
	"legal",
	"legalNotice",
	"metadata",
	"notFound",
	"paymentConfirmation",
	"privacyPolicy",
	"termsOfService",
] as const;

const SERVER_ONLY = new Set<string>(SERVER_ONLY_NAMESPACES);

export const isServerOnlyNamespace = (namespace: string) => SERVER_ONLY.has(namespace);

export const clientMessagesOf = (messages: AbstractIntlMessages): AbstractIntlMessages =>
	Object.fromEntries(Object.entries(messages).filter(([namespace]) => !isServerOnlyNamespace(namespace)));
