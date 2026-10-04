const SELECTOR = "figure.mermaid";
const EXPANDED = "mermaid-expanded";

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
