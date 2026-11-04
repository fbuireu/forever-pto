const SELECTOR = "figure.mermaid";
const EXPANDED = "mermaid-expanded";

const toggleExpanded = (figure: HTMLElement): void => {
	const expanded = figure.classList.toggle(EXPANDED);
	for (const svg of figure.querySelectorAll("svg")) {
		svg.style.maxWidth = expanded ? "none" : "";
		svg.style.width = expanded ? `${svg.viewBox.baseVal.width}px` : "";
	}
};

export const startMermaidZoom = (): void => {
	document.addEventListener("click", (event) => {
		const figure = event.target instanceof Element ? event.target.closest<HTMLElement>(SELECTOR) : null;
		if (figure) toggleExpanded(figure);
	});
};
