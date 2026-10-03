import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";
import { type RenderedDiagram, renderMermaid } from "./mermaid-render";

type MdastPlugin = NonNullable<SatteriProcessorOptions["mdastPlugins"]>[number];

const MERMAID_LANG = "mermaid";

export const mermaidPlugin: MdastPlugin = {
	name: "forever-pto-mermaid",
	async code(node, context) {
		if (node.lang !== MERMAID_LANG) return;

		let drawn: RenderedDiagram;
		try {
			drawn = await renderMermaid(node.value);
		} catch (error) {
			throw new Error(`Mermaid could not draw a diagram in ${context.fileURL ?? "an unknown page"}: ${String(error)}`);
		}

		// One figure per theme, replacing the fence with two nodes rather than one holding both. Parsed
		// together, a label drawn as `<foreignObject>` HTML keeps the parser inside the first diagram's
		// subtree and the second `<svg>` lands in it; `mermaid-render.ts` draws labels as SVG text, and
		// each raw node is parsed on its own besides, so the two stay siblings. `global.css` shows one,
		// keyed on `data-theme` the way the app's own tokens are.
		const source = encodeURIComponent(node.value);
		const figure = (svg: string, theme: "light" | "dark") => ({
			raw: `<figure class="${MERMAID_LANG} mermaid-${theme}" data-mermaid="${source}">${svg}</figure>`,
			mdxExpressions: false,
		});

		context.replaceNode(node, [figure(drawn.light, "light"), figure(drawn.dark, "dark")]);
	},
};
