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
	ca: {
		consentModal: {
			title: "Cookies",
			description:
				"Aquesta wiki fa servir cookies només per mesurar quines pàgines es llegeixen. No en necessites cap per navegar-hi, i rebutjar-les no et costa res.",
			acceptAllBtn: "Accepta-les totes",
			acceptNecessaryBtn: "Rebutja-les totes",
			showPreferencesBtn: "Tria",
		},
		preferencesModal: {
			title: "Preferències de cookies",
			acceptAllBtn: "Accepta-les totes",
			acceptNecessaryBtn: "Rebutja-les totes",
			savePreferencesBtn: "Desa la meva elecció",
			closeIconLabel: "Tanca",
			sections: [
				{
					title: "Estrictament necessàries",
					description: "Recorda l'elecció que facis aquí. No es pot desactivar, perquè és el que guarda la resposta.",
					linkedCategory: "necessary",
				},
				{
					title: "Analítica",
					description:
						"Pàgines vistes i errors, per millorar la wiki allà on de debò es llegeix. Cada servei s'activa per separat.",
					linkedCategory: ANALYTICS_CATEGORY,
				},
			],
		},
	},
	it: {
		consentModal: {
			title: "Cookie",
			description:
				"Questa wiki usa i cookie solo per misurare quali pagine vengono lette. Non ne serve nessuno per navigarla, e rifiutarli non ti costa nulla.",
			acceptAllBtn: "Accetta tutti",
			acceptNecessaryBtn: "Rifiuta tutti",
			showPreferencesBtn: "Scegli",
		},
		preferencesModal: {
			title: "Preferenze cookie",
			acceptAllBtn: "Accetta tutti",
			acceptNecessaryBtn: "Rifiuta tutti",
			savePreferencesBtn: "Salva la mia scelta",
			closeIconLabel: "Chiudi",
			sections: [
				{
					title: "Strettamente necessari",
					description: "Ricorda la scelta che fai qui. Non si può disattivare, perché è ciò che conserva la risposta.",
					linkedCategory: "necessary",
				},
				{
					title: "Analisi",
					description:
						"Pagine viste ed errori, per migliorare la wiki dove viene letta davvero. Ogni servizio si attiva da solo.",
					linkedCategory: ANALYTICS_CATEGORY,
				},
			],
		},
	},
	fr: {
		consentModal: {
			title: "Cookies",
			description:
				"Ce wiki utilise des cookies uniquement pour mesurer quelles pages sont lues. Aucun n'est nécessaire pour le parcourir, et les refuser ne te coûte rien.",
			acceptAllBtn: "Tout accepter",
			acceptNecessaryBtn: "Tout refuser",
			showPreferencesBtn: "Choisir",
		},
		preferencesModal: {
			title: "Préférences de cookies",
			acceptAllBtn: "Tout accepter",
			acceptNecessaryBtn: "Tout refuser",
			savePreferencesBtn: "Enregistrer mon choix",
			closeIconLabel: "Fermer",
			sections: [
				{
					title: "Strictement nécessaires",
					description:
						"Retient le choix que tu fais ici. Ne peut pas être désactivé, car c'est ce qui enregistre la réponse.",
					linkedCategory: "necessary",
				},
				{
					title: "Mesure d'audience",
					description:
						"Pages vues et erreurs, pour améliorer le wiki là où il est vraiment lu. Chaque service s'active séparément.",
					linkedCategory: ANALYTICS_CATEGORY,
				},
			],
		},
	},
	de: {
		consentModal: {
			title: "Cookies",
			description:
				"Dieses Wiki verwendet Cookies nur, um zu messen, welche Seiten gelesen werden. Zum Lesen brauchst du keines davon, und Ablehnen kostet dich nichts.",
			acceptAllBtn: "Alle akzeptieren",
			acceptNecessaryBtn: "Alle ablehnen",
			showPreferencesBtn: "Auswählen",
		},
		preferencesModal: {
			title: "Cookie-Einstellungen",
			acceptAllBtn: "Alle akzeptieren",
			acceptNecessaryBtn: "Alle ablehnen",
			savePreferencesBtn: "Meine Auswahl speichern",
			closeIconLabel: "Schließen",
			sections: [
				{
					title: "Unbedingt erforderlich",
					description:
						"Merkt sich die Auswahl, die du hier triffst. Lässt sich nicht abschalten, weil es die Antwort speichert.",
					linkedCategory: "necessary",
				},
				{
					title: "Analyse",
					description:
						"Seitenaufrufe und Fehler, damit das Wiki dort besser wird, wo es wirklich gelesen wird. Jeder Dienst lässt sich einzeln einschalten.",
					linkedCategory: ANALYTICS_CATEGORY,
				},
			],
		},
	},
};

type Language = keyof typeof TRANSLATIONS;

const LANGUAGES = Object.keys(TRANSLATIONS) as Language[];

const language = (): Language => LANGUAGES.find((code) => document.documentElement.lang.startsWith(code)) ?? "en";

const isServiceConsented = (serviceId: string): boolean =>
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
