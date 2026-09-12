import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { satteri } from "@astrojs/markdown-satteri";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { mermaidPlugin } from "./src/lib/mermaid-plugin";

// tsconfig.json is the single declaration of where the app's UI layer sits: `astro check` reads it, and
// this file derives the build-time alias from the same string rather than spelling it a second time.
// Both resolve against this directory, so the value needs no adjustment.
const UI_ALIAS = "@ui/*";
const tsconfig = JSON.parse(readFileSync(new URL("./tsconfig.json", import.meta.url), "utf8")) as {
	compilerOptions: { paths: Record<string, string[] | undefined> };
};
const uiTarget = tsconfig.compilerOptions.paths[UI_ALIAS]?.[0]?.replace(/\/\*$/, "");

if (!uiTarget) {
	throw new Error(`tsconfig.json declares no "${UI_ALIAS}" path, so no demo can import an app component`);
}

export default defineConfig({
	site: "https://docs.forever-pto.com",
	redirects: {
		"/architecture/middleware/": "/architecture/proxy/",
	},
	markdown: {
		processor: satteri({ mdastPlugins: [mermaidPlugin] }),
	},
	integrations: [
		starlight({
			title: "Forever PTO",
			description: "Documentation and internal wiki for Forever PTO, the PTO optimization tool.",
			logo: { src: "./src/assets/forever-pto-logo.png", alt: "Forever PTO" },
			favicon: "/favicon.ico",
			head: [
				{
					tag: "meta",
					attrs: { property: "og:image", content: "https://docs.forever-pto.com/og.png" },
				},
				{
					tag: "meta",
					attrs: { name: "twitter:card", content: "summary_large_image" },
				},
			],
			customCss: ["./src/styles/global.css"],
			components: { Head: "./src/components/Head.astro", SiteTitle: "./src/components/SiteTitle.astro" },
			defaultLocale: "root",
			// The same six the app serves (LOCALES in apps/web/src/infrastructure/i18n/locales.ts), so the
			// language picker offers what the planner does. Starlight ships the chrome translations for all
			// of them and falls back to English for a page with no translation of its own.
			locales: {
				root: { label: "English", lang: "en" },
				es: { label: "Español", lang: "es" },
				ca: { label: "Català", lang: "ca" },
				it: { label: "Italiano", lang: "it" },
				fr: { label: "Français", lang: "fr" },
				de: { label: "Deutsch", lang: "de" },
			},
			social: [{ icon: "github", label: "GitHub", href: "https://github.com/fbuireu/forever-pto" }],
			editLink: { baseUrl: "https://github.com/fbuireu/forever-pto/edit/main/apps/docs/" },
			lastUpdated: true,
			expressiveCode: { themes: ["github-dark", "github-light"] },
			sidebar: [
				{
					label: "Start here",
					translations: {
						es: "Empieza aquí",
						ca: "Comença aquí",
						it: "Inizia qui",
						fr: "Commencer ici",
						de: "Erste Schritte",
					},
					items: [{ autogenerate: { directory: "start" } }],
				},
				{
					label: "Architecture",
					translations: {
						es: "Arquitectura",
						ca: "Arquitectura",
						it: "Architettura",
						fr: "Architecture",
						de: "Architektur",
					},
					collapsed: true,
					items: [{ autogenerate: { directory: "architecture" } }],
				},
				{
					label: "How it works",
					translations: {
						es: "Cómo funciona",
						ca: "Com funciona",
						it: "Come funziona",
						fr: "Comment ça marche",
						de: "So funktioniert es",
					},
					collapsed: true,
					items: [{ autogenerate: { directory: "how-it-works" } }],
				},
				{
					label: "Design system",
					translations: { es: "Design system" },
					collapsed: true,
					items: [
						{
							label: "Foundations",
							translations: {
								es: "Fundamentos",
								ca: "Fonaments",
								it: "Fondamenti",
								fr: "Fondations",
								de: "Grundlagen",
							},
							items: [{ autogenerate: { directory: "design-system/foundations" } }],
						},
						{
							label: "Components",
							translations: {
								es: "Componentes",
								ca: "Components",
								it: "Componenti",
								fr: "Composants",
								de: "Komponenten",
							},
							collapsed: true,
							items: [{ autogenerate: { directory: "design-system/components" } }],
						},
						{
							label: "Animation",
							translations: { es: "Animación", ca: "Animació", it: "Animazione", fr: "Animation", de: "Animation" },
							collapsed: true,
							items: [{ autogenerate: { directory: "design-system/animation" } }],
						},
						{
							label: "Patterns",
							translations: { es: "Patrones", ca: "Patrons", it: "Pattern", fr: "Motifs", de: "Muster" },
							collapsed: true,
							items: [{ autogenerate: { directory: "design-system/patterns" } }],
						},
					],
				},
				{
					label: "Infrastructure & CI/CD",
					translations: {
						es: "Infraestructura y CI/CD",
						ca: "Infraestructura i CI/CD",
						it: "Infrastruttura e CI/CD",
						fr: "Infrastructure et CI/CD",
						de: "Infrastruktur & CI/CD",
					},
					collapsed: true,
					items: [{ autogenerate: { directory: "infra" } }],
				},
				{
					label: "Reference",
					translations: { es: "Referencia", ca: "Referència", it: "Riferimento", fr: "Référence", de: "Referenz" },
					collapsed: true,
					items: [{ autogenerate: { directory: "reference" } }],
				},
				{
					label: "Contributing",
					translations: { es: "Contribuir", ca: "Contribuir", it: "Contribuire", fr: "Contribuer", de: "Mitwirken" },
					collapsed: true,
					items: [{ autogenerate: { directory: "contributing" } }],
				},
			],
		}),
		react({ experimentalReactChildren: true }),
	],
	vite: {
		plugins: [tailwindcss()],
		// Tailwind runs via the Vite plugin; an inline (empty) PostCSS config stops
		// Vite from walking up and loading the app's postcss.config.mjs.
		css: { postcss: { plugins: [] } },
		resolve: {
			alias: {
				"@ui": fileURLToPath(new URL(uiTarget, import.meta.url)),
			},
		},
	},
});
