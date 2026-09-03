import { render, screen } from "@testing-library/react";
import type { SvgIcon } from "@ui/assets/icons/types";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";

const icon: SvgIcon = {
	title: "GitHub",
	slug: "github",
	hex: "181717",
	path: "M0 0h16v16H0z",
	svg: '<svg role="img" viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>',
};

describe("Icon", () => {
	it("names the graphic after the icon's title, so it reads as an image with a label", () => {
		render(<Icon icon={icon} />);

		expect(screen.getByRole("img", { name: "GitHub" })).toBeDefined();
	});

	it("takes the view box from the source SVG rather than assuming a 24 unit grid", () => {
		const { container } = render(<Icon icon={icon} />);

		expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 16 16");
	});

	it("falls back to the 24 unit grid when the source declares no view box", () => {
		const { container } = render(<Icon icon={{ ...icon, svg: "<svg></svg>" }} />);

		expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 24 24");
	});

	it("renders at 24 pixels unless told otherwise", () => {
		const { container, rerender } = render(<Icon icon={icon} />);
		const sizeOf = () => [
			container.querySelector("svg")?.getAttribute("width"),
			container.querySelector("svg")?.getAttribute("height"),
		];

		expect(sizeOf()).toEqual(["24", "24"]);

		rerender(<Icon icon={icon} size={40} className="text-muted-foreground" />);

		expect(sizeOf()).toEqual(["40", "40"]);
		expect(container.querySelector("svg")?.getAttribute("class")).toBe("text-muted-foreground");
	});
});
