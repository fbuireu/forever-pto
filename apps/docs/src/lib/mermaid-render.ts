import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { type Browser, chromium, type Page } from "@playwright/test";
import type { MermaidConfig } from "mermaid";

const require = createRequire(import.meta.url);

const APP_TOKENS = fileURLToPath(new URL("../../../web/src/ui/styles/global/index.css", import.meta.url));
const MERMAID_UMD = require.resolve("mermaid/dist/mermaid.min.js");
const FONT_FILE = require.resolve("@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2");
const FONT_FAMILY = "Space Grotesk Variable";

const TOKEN_NAMES = [
	"frame",
	"accent",
	"foreground",
	"surface-panel",
	"surface-panel-alt",
	"muted",
	"color-brand-ink",
] as const;
type Tokens = Record<(typeof TOKEN_NAMES)[number], string>;

const readTokens = (): { light: Tokens; dark: Tokens } => {
	const css = readFileSync(APP_TOKENS, "utf8");
	const block = (selector: RegExp) => {
		const match = css.match(selector);
		if (!match) throw new Error(`mermaid: no ${selector} block in ${APP_TOKENS}`);
		return match[1];
	};
	const declared = (source: string, name: string) => source.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();

	const light = Object.fromEntries(
		TOKEN_NAMES.map((name) => {
			const value = declared(block(/:root\s*\{([\s\S]*?)\n\}/), name);
			if (!value) throw new Error(`mermaid: --${name} is not declared in ${APP_TOKENS}`);
			return [name, value];
		}),
	) as Tokens;

	const darkBlock = block(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);
	const dark = Object.fromEntries(
		TOKEN_NAMES.map((name) => [name, declared(darkBlock, name) ?? light[name]]),
	) as Tokens;

	return { light, dark };
};

const configuration = (tokens: Tokens, dark: boolean): MermaidConfig => ({
	startOnLoad: false,
	securityLevel: "strict",
	theme: "base",
	layout: "dagre",
	fontFamily: `${FONT_FAMILY}, system-ui, sans-serif`,
	flowchart: { curve: "basis", padding: 12, htmlLabels: false },
	htmlLabels: false,
	sequence: { mirrorActors: false, actorMargin: 40, boxMargin: 8, messageMargin: 32 },
	themeVariables: {
		darkMode: dark,
		background: tokens["surface-panel"],
		fontSize: "14px",
		primaryColor: tokens.accent,
		primaryTextColor: tokens["color-brand-ink"],
		primaryBorderColor: tokens.frame,
		secondaryColor: tokens["surface-panel-alt"],
		secondaryTextColor: tokens.foreground,
		secondaryBorderColor: tokens.frame,
		tertiaryColor: tokens["surface-panel"],
		tertiaryTextColor: tokens.foreground,
		tertiaryBorderColor: tokens.frame,
		lineColor: tokens.frame,
		textColor: tokens.foreground,
		mainBkg: tokens["surface-panel-alt"],
		nodeBorder: tokens.frame,
		nodeTextColor: tokens.foreground,
		clusterBkg: tokens["surface-panel"],
		clusterBorder: tokens.frame,
		titleColor: tokens.foreground,
		edgeLabelBackground: tokens["surface-panel"],
		actorBkg: tokens["surface-panel-alt"],
		actorBorder: tokens.frame,
		actorTextColor: tokens.foreground,
		actorLineColor: tokens.frame,
		signalColor: tokens.foreground,
		signalTextColor: tokens.foreground,
		labelBoxBkgColor: tokens.accent,
		labelBoxBorderColor: tokens.frame,
		labelTextColor: tokens["color-brand-ink"],
		loopTextColor: tokens.foreground,
		noteBkgColor: tokens.accent,
		noteBorderColor: tokens.frame,
		noteTextColor: tokens["color-brand-ink"],
		activationBkgColor: tokens.muted,
		activationBorderColor: tokens.frame,
		sequenceNumberColor: tokens["color-brand-ink"],
		attributeBackgroundColorOdd: tokens["surface-panel"],
		attributeBackgroundColorEven: tokens["surface-panel-alt"],
	},
});

let browser: Promise<Browser> | undefined;
let page: Promise<Page> | undefined;
const rendered = new Map<string, Promise<RenderedDiagram>>();

const renderer = async (): Promise<Page> => {
	if (page) return page;
	browser = chromium.launch();
	page = browser.then(async (instance) => {
		const tab = await instance.newPage();
		const font = readFileSync(FONT_FILE).toString("base64");
		await tab.setContent(
			`<!doctype html><html><head><style>@font-face{font-family:"${FONT_FAMILY}";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:300 700}body{font-family:"${FONT_FAMILY}"}</style></head><body><span style="font-family:'${FONT_FAMILY}'">measure</span></body></html>`,
		);
		await tab.addScriptTag({ path: MERMAID_UMD });
		await tab.evaluate(() => document.fonts.ready);
		return tab;
	});
	process.once("beforeExit", () => {
		void browser?.then((instance) => instance.close());
	});
	return page;
};

export interface RenderedDiagram {
	light: string;
	dark: string;
}

export const renderMermaid = (source: string): Promise<RenderedDiagram> => {
	const key = createHash("sha1").update(source).digest("hex").slice(0, 12);
	const cached = rendered.get(key);
	if (cached) return cached;

	const job = (async () => {
		const tab = await renderer();
		const tokens = readTokens();
		const draw = (theme: "light" | "dark") =>
			tab.evaluate(
				async ({ source, config, id }) => {
					const mermaid = (window as unknown as { mermaid: typeof import("mermaid").default }).mermaid;
					mermaid.initialize(config);
					const { svg } = await mermaid.render(id, source);
					return svg;
				},
				{ source, config: configuration(tokens[theme], theme === "dark"), id: `mermaid-${key}-${theme}` },
			);

		return { light: await draw("light"), dark: await draw("dark") };
	})();

	rendered.set(key, job);
	return job;
};
