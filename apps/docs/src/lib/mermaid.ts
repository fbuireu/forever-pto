import type { MermaidConfig } from "mermaid";

const SELECTOR = "pre.mermaid[data-mermaid]";
const RENDERED = "data-mermaid-rendered";
const EXPANDED = "mermaid-expanded";
const THEME_ATTRIBUTE = "data-theme";

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Mermaid's `base` theme takes every colour as a variable, and these read the app's own tokens off
 * `:root` at render time, so a diagram is drawn in the same ink, cream and yellow as the component
 * beside it and flips with the theme toggle without a second palette being spelled here.
 */
const configuration = (): MermaidConfig => {
	const frame = token("--frame");
	const foreground = token("--foreground");
	const panel = token("--surface-panel");
	const panelAlt = token("--surface-panel-alt");
	const accent = token("--accent");
	const muted = token("--muted");
	const isDark = document.documentElement.getAttribute(THEME_ATTRIBUTE) === "dark";

	return {
		startOnLoad: false,
		securityLevel: "strict",
		theme: "base",
		fontFamily: `${token("--font-space-grotesk")}, system-ui, sans-serif`,
		flowchart: { curve: "basis", padding: 12, htmlLabels: true },
		sequence: { mirrorActors: false, actorMargin: 40, boxMargin: 8, messageMargin: 32 },
		themeVariables: {
			darkMode: isDark,
			background: panel,
			fontSize: "14px",
			primaryColor: accent,
			primaryTextColor: "#0e0e0e",
			primaryBorderColor: frame,
			secondaryColor: panelAlt,
			secondaryTextColor: foreground,
			secondaryBorderColor: frame,
			tertiaryColor: panel,
			tertiaryTextColor: foreground,
			tertiaryBorderColor: frame,
			lineColor: frame,
			textColor: foreground,
			mainBkg: panelAlt,
			nodeBorder: frame,
			nodeTextColor: foreground,
			clusterBkg: panel,
			clusterBorder: frame,
			titleColor: foreground,
			edgeLabelBackground: panel,
			actorBkg: panelAlt,
			actorBorder: frame,
			actorTextColor: foreground,
			actorLineColor: frame,
			signalColor: foreground,
			signalTextColor: foreground,
			labelBoxBkgColor: accent,
			labelBoxBorderColor: frame,
			labelTextColor: "#0e0e0e",
			loopTextColor: foreground,
			noteBkgColor: accent,
			noteBorderColor: frame,
			noteTextColor: "#0e0e0e",
			activationBkgColor: muted,
			activationBorderColor: frame,
			sequenceNumberColor: "#0e0e0e",
			attributeBackgroundColorOdd: panel,
			attributeBackgroundColorEven: panelAlt,
		},
	};
};

let sequence = 0;

const toggleExpanded = (block: HTMLElement) => {
	const svg = block.querySelector("svg");
	if (!svg) return;
	const expanded = block.classList.toggle(EXPANDED);
	svg.style.maxWidth = expanded ? "none" : "";
	svg.style.width = expanded ? `${svg.viewBox.baseVal.width}px` : "";
};

const renderAll = async () => {
	const blocks = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
	if (blocks.length === 0) return;

	const { default: mermaid } = await import("mermaid");
	mermaid.initialize(configuration());

	await Promise.all(
		blocks.map(async (block) => {
			const source = decodeURIComponent(block.getAttribute("data-mermaid") ?? "");
			if (!source) return;
			try {
				sequence += 1;
				const { svg, bindFunctions } = await mermaid.render(`mermaid-${sequence}`, source);
				block.innerHTML = svg;
				bindFunctions?.(block);
				block.setAttribute(RENDERED, "true");
			} catch {
				block.textContent = source;
				block.setAttribute(RENDERED, "error");
			}
		}),
	);
};

/**
 * Renders every diagram on the page once, and again whenever Starlight's theme toggle rewrites
 * `data-theme` on `<html>`, since the colours are read at render time and an SVG does not repaint itself.
 * A drawn diagram is scaled to the column; clicking it toggles its natural size inside a scrolling frame,
 * which is what makes a wide graph legible without giving every page a horizontal scrollbar.
 */
export const startMermaid = () => {
	void renderAll();

	document.addEventListener("click", (event) => {
		const block = (event.target as Element | null)?.closest<HTMLElement>(`${SELECTOR}[${RENDERED}="true"]`);
		if (block) toggleExpanded(block);
	});

	new MutationObserver((mutations) => {
		if (mutations.some((mutation) => mutation.attributeName === THEME_ATTRIBUTE)) void renderAll();
	}).observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
};
