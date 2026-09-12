import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";
import { renderMermaid } from "./mermaid-render";

type MdastPlugin = NonNullable<SatteriProcessorOptions["mdastPlugins"]>[number];

export const MERMAID_LANG = "mermaid";

export const mermaidPlugin: MdastPlugin = {
	name: "forever-pto-mermaid",
	async code(node, context) {
		if (node.lang !== MERMAID_LANG) return;

		let drawn: Awaited<ReturnType<typeof renderMermaid>>;
		try {
			drawn = await renderMermaid(node.value);
		} catch (error) {
			throw new Error(`Mermaid could not draw a diagram in ${context.fileURL ?? "an unknown page"}: ${String(error)}`);
		}

		// One figure per theme, replacing the fence with two nodes rather than one holding both. Parsed
		// together, the second `<svg>` lands inside the first: Mermaid's labels are `<foreignObject>`
		// elements carrying their own HTML, and the parser never leaves the first diagram's subtree.
		// Each raw node is parsed on its own, so the two stay siblings; `global.css` shows one, keyed on
		// `data-theme` the way the app's own tokens are.
		const source = encodeURIComponent(node.value);
		const figure = (svg: string, theme: "light" | "dark") => ({
			raw: `<figure class="${MERMAID_LANG} mermaid-${theme}" data-mermaid="${source}">${svg}</figure>`,
			mdxExpressions: false,
		});

		context.replaceNode(node, [figure(drawn.light, "light"), figure(drawn.dark, "dark")]);
	},
};
