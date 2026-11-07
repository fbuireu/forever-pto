import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";
import { type RenderedDiagram, renderMermaid } from "./mermaid-render";

type MdastPlugin = NonNullable<SatteriProcessorOptions["mdastPlugins"]>[number];

const MERMAID_LANG = "mermaid";
const HTML_IN_SVG = /<(em|strong|b|i|code|br|p|div|span|ul|ol|li|h[1-6]|pre|table|img|small|sub|sup|s|u)[\s>/]/;

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

		const stray = [drawn.light, drawn.dark].map((svg) => HTML_IN_SVG.exec(svg)?.[0]).find(Boolean);
		if (stray) {
			throw new Error(
				`Mermaid drew a diagram in ${context.fileURL ?? "an unknown page"} with an HTML ${stray} inside its SVG, which closes the SVG early in the browser`,
			);
		}

		const source = encodeURIComponent(node.value);
		const figure = (svg: string, theme: "light" | "dark") => ({
			raw: `<figure class="${MERMAID_LANG} mermaid-${theme}" data-mermaid="${source}">${svg}</figure>`,
			mdxExpressions: false,
		});

		context.replaceNode(node, [figure(drawn.light, "light"), figure(drawn.dark, "dark")]);
	},
};
