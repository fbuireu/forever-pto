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

		const source = encodeURIComponent(node.value);
		const figure = (svg: string, theme: "light" | "dark") => ({
			raw: `<figure class="${MERMAID_LANG} mermaid-${theme}" data-mermaid="${source}">${svg}</figure>`,
			mdxExpressions: false,
		});

		context.replaceNode(node, [figure(drawn.light, "light"), figure(drawn.dark, "dark")]);
	},
};
