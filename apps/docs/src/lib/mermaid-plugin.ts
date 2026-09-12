import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";

type MdastPlugin = NonNullable<SatteriProcessorOptions["mdastPlugins"]>[number];

export const MERMAID_LANG = "mermaid";
export const MERMAID_SOURCE_ATTRIBUTE = "data-mermaid";

/**
 * Turns every ```mermaid fence into a `<pre class="mermaid" data-mermaid="…">` before Expressive Code
 * sees it, so the fence reaches the browser as a diagram source rather than highlighted as text. The
 * source travels URI-encoded in the attribute (the canonical copy the client renders) and as the
 * element's text (what a reader without JavaScript sees). `mermaid.ts` in this folder is the other half.
 *
 * Starlight runs on Sätteri, Astro's default Markdown processor, which takes mdast plugins of this shape
 * rather than remark plugins; a `paragraph` carrying `hName`/`hProperties` is how a plugin emits an
 * arbitrary element from either a `.md` or an `.mdx` page.
 */
export const mermaidPlugin: MdastPlugin = {
	name: "forever-pto-mermaid",
	code(node) {
		if (node.lang !== MERMAID_LANG) return;

		const paragraph = { type: "paragraph" as const, children: [{ type: "text" as const, value: node.value }] };
		Object.assign(paragraph, {
			data: {
				hName: "pre",
				hProperties: { className: MERMAID_LANG, [MERMAID_SOURCE_ATTRIBUTE]: encodeURIComponent(node.value) },
			},
		});

		return paragraph;
	},
};
