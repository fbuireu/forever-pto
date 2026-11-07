const SELECTOR = "figure.mermaid";
const EXPANDED = "mermaid-expanded";

const toggleExpanded = (figure: HTMLElement): void => {
	const expanded = figure.classList.toggle(EXPANDED);
	for (const svg of figure.querySelectorAll("svg")) {
		svg.style.maxWidth = expanded ? "none" : "";
		svg.style.width = expanded ? `${svg.viewBox.baseVal.width}px` : "";
	}
};

const ACTIVATION_KEYS = new Set(["Enter", " "]);

const figureFrom = (target: EventTarget | null): HTMLElement | null =>
	target instanceof Element ? target.closest<HTMLElement>(SELECTOR) : null;

export const startMermaidZoom = (): void => {
	document.addEventListener("click", (event) => {
		const figure = figureFrom(event.target);
		if (figure) toggleExpanded(figure);
	});
	document.addEventListener("keydown", (event) => {
		const figure = figureFrom(event.target);
		if (!figure || event.target !== figure || !ACTIVATION_KEYS.has(event.key)) return;
		event.preventDefault();
		toggleExpanded(figure);
	});
};
