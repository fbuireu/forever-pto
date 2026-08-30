import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

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
	integrations: [
		starlight({
			title: "Forever PTO",
			description: "Documentation and internal wiki for Forever PTO, the PTO optimization tool.",
			logo: {
				light: "./src/assets/logo-light.svg",
				dark: "./src/assets/logo-dark.svg",
			},
			favicon: "/favicon.svg",
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
			components: { SiteTitle: "./src/components/SiteTitle.astro" },
			defaultLocale: "root",
			locales: {
				root: { label: "English", lang: "en" },
				es: { label: "Español", lang: "es" },
			},
			social: [{ icon: "github", label: "GitHub", href: "https://github.com/fbuireu/forever-pto" }],
			editLink: { baseUrl: "https://github.com/fbuireu/forever-pto/edit/main/apps/docs/" },
			lastUpdated: true,
			expressiveCode: { themes: ["github-dark", "github-light"] },
			sidebar: [
				{
					label: "Start here",
					translations: { es: "Empieza aquí" },
					items: [{ autogenerate: { directory: "start" } }],
				},
				{
					label: "Architecture",
					translations: { es: "Arquitectura" },
					collapsed: true,
					items: [{ autogenerate: { directory: "architecture" } }],
				},
				{
					label: "How it works",
					translations: { es: "Cómo funciona" },
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
							translations: { es: "Fundamentos" },
							items: [{ autogenerate: { directory: "design-system/foundations" } }],
						},
						{
							label: "Components",
							translations: { es: "Componentes" },
							collapsed: true,
							items: [{ autogenerate: { directory: "design-system/components" } }],
						},
						{
							label: "Animation",
							translations: { es: "Animación" },
							collapsed: true,
							items: [{ autogenerate: { directory: "design-system/animation" } }],
						},
						{
							label: "Patterns",
							translations: { es: "Patrones" },
							collapsed: true,
							items: [{ autogenerate: { directory: "design-system/patterns" } }],
						},
					],
				},
				{
					label: "Infrastructure & CI/CD",
					translations: { es: "Infraestructura y CI/CD" },
					collapsed: true,
					items: [{ autogenerate: { directory: "infra" } }],
				},
				{
					label: "Reference",
					translations: { es: "Referencia" },
					collapsed: true,
					items: [{ autogenerate: { directory: "reference" } }],
				},
				{
					label: "Contributing",
					translations: { es: "Contribuir" },
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
