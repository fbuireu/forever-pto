import * as CookieConsentLib from "vanilla-cookieconsent";
import { trackingStage } from "./stage";

export const ANALYTICS_CATEGORY = "analytics";
export const GOOGLE_ANALYTICS_SERVICE_ID = "ga4";
export const BETTER_STACK_SERVICE_ID = "betterStack";

const TRACKING_TOKEN = import.meta.env.PUBLIC_BETTER_STACK_TRACKING_TOKEN;

type Gtag = (...args: unknown[]) => void;
type BetterStack = (command: string, ...args: unknown[]) => void;

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: Gtag;
		betterstack?: BetterStack;
	}
}

const TRANSLATIONS = {
	en: {
		consentModal: {
			title: "Cookies",
			description:
				"This wiki uses cookies only to measure which pages get read. Nothing here is needed to browse it, and rejecting costs you nothing.",
			acceptAllBtn: "Accept all",
			acceptNecessaryBtn: "Reject all",
			showPreferencesBtn: "Choose",
		},
		preferencesModal: {
			title: "Cookie preferences",
			acceptAllBtn: "Accept all",
			acceptNecessaryBtn: "Reject all",
			savePreferencesBtn: "Save my choice",
			closeIconLabel: "Close",
			sections: [
				{
					title: "Strictly necessary",
					description:
						"Remembers the choice you make here. Cannot be turned off, because it is what stores the answer.",
					linkedCategory: "necessary",
				},
				{
					title: "Analytics",
					description:
						"Page views and errors, so the wiki can be improved where it is actually read. Each service can be turned on by itself.",
					linkedCategory: ANALYTICS_CATEGORY,
				},
			],
		},
	},
	es: {
		consentModal: {
			title: "Cookies",
			description:
				"Esta wiki usa cookies solo para medir qué páginas se leen. Nada de esto hace falta para navegarla, y rechazar no te cuesta nada.",
			acceptAllBtn: "Aceptar todas",
			acceptNecessaryBtn: "Rechazar todas",
			showPreferencesBtn: "Elegir",
		},
		preferencesModal: {
			title: "Preferencias de cookies",
			acceptAllBtn: "Aceptar todas",
			acceptNecessaryBtn: "Rechazar todas",
			savePreferencesBtn: "Guardar mi elección",
			closeIconLabel: "Cerrar",
			sections: [
				{
					title: "Estrictamente necesarias",
					description:
						"Recuerda la elección que hagas aquí. No se puede desactivar, porque es lo que guarda la respuesta.",
					linkedCategory: "necessary",
				},
				{
					title: "Analítica",
					description:
						"Páginas vistas y errores, para mejorar la wiki donde de verdad se lee. Cada servicio se activa por separado.",
					linkedCategory: ANALYTICS_CATEGORY,
				},
			],
		},
	},
};

const language = () => (document.documentElement.lang.startsWith("es") ? "es" : "en");

export const isServiceConsented = (serviceId: string): boolean =>
	CookieConsentLib.acceptedService(serviceId, ANALYTICS_CATEGORY);

const updateGoogleConsent = () => {
	const granted = isServiceConsented(GOOGLE_ANALYTICS_SERVICE_ID);

	window.gtag?.("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
	if (granted) window.gtag?.("event", "page_view");
};

let betterStackLoaded = false;

const loadBetterStack = () => {
	if (betterStackLoaded || !TRACKING_TOKEN || !isServiceConsented(BETTER_STACK_SERVICE_ID)) return;

	betterStackLoaded = true;

	const queued: unknown[][] = [];
	const stub = ((...args: unknown[]) => {
		queued.push(args);
	}) as BetterStack & { q: unknown[][]; l: number };
	stub.q = queued;
	stub.l = Date.now();
	window.betterstack = stub;

	const script = document.createElement("script");
	script.async = true;
	script.crossOrigin = "anonymous";
	script.src = `https://betterstack.net/b.js?t=${TRACKING_TOKEN}`;
	document.head.appendChild(script);

	window.betterstack("init", { environment: trackingStage(window.location.hostname) });
};

const applyConsent = () => {
	updateGoogleConsent();
	loadBetterStack();
};

export const startCookieConsent = () => {
	CookieConsentLib.run({
		guiOptions: {
			consentModal: { layout: "box", position: "bottom right" },
			preferencesModal: { layout: "box" },
		},
		categories: {
			necessary: { enabled: true, readOnly: true },
			[ANALYTICS_CATEGORY]: {
				services: {
					[GOOGLE_ANALYTICS_SERVICE_ID]: { label: "Google Analytics" },
					[BETTER_STACK_SERVICE_ID]: { label: "Better Stack" },
				},
			},
		},
		language: { default: language(), translations: TRANSLATIONS },
		onConsent: applyConsent,
		onChange: applyConsent,
	});
};
