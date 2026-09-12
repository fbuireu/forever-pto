const SELECTOR = "figure.mermaid";
const EXPANDED = "mermaid-expanded";

/**
 * A drawn diagram is scaled to the column; clicking it toggles its natural size inside a scrolling frame,
 * which is what makes a wide graph legible without giving every page a horizontal scrollbar. The drawing
 * itself happened at build time (see mermaid-plugin.ts); this is the only script a diagram needs.
 */
const toggleExpanded = (figure: HTMLElement) => {
	const expanded = figure.classList.toggle(EXPANDED);
	for (const svg of figure.querySelectorAll("svg")) {
		svg.style.maxWidth = expanded ? "none" : "";
		svg.style.width = expanded ? `${svg.viewBox.baseVal.width}px` : "";
	}
};

export const startMermaidZoom = () => {
	document.addEventListener("click", (event) => {
		const figure = (event.target as Element | null)?.closest<HTMLElement>(SELECTOR);
		if (figure) toggleExpanded(figure);
	});
};
