import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface MotionValue {
	get: () => number;
	on: (event: "change", listener: () => void) => () => void;
}

interface ShapeProps {
	children?: ReactNode;
	className?: string;
	style: { x: MotionValue; y: MotionValue };
}

const shapes = vi.hoisted(() => ({ styles: [] as ShapeProps["style"][] }));

vi.mock("motion/react", async () => {
	const actual = await vi.importActual<typeof import("motion/react")>("motion/react");
	const { createElement, useEffect } = await import("react");

	const Shape = ({ children, className, style }: ShapeProps) => {
		shapes.styles.push(style);
		useEffect(() => {
			const stop = [style.x.on("change", () => undefined), style.y.on("change", () => undefined)];
			return () => {
				for (const unsubscribe of stop) unsubscribe();
			};
		}, [style]);
		return createElement("div", { className }, children);
	};

	return { ...actual, useSpring: (source: unknown) => source, m: { div: Shape } };
});

const { CtaShapesClient } = await import("./CtaShapesClient");

const COPY = {
	byeMonday: "Bye Monday",
	bossOff: "Boss off",
	doNotDisturb: "Do not disturb",
	zeroRegrets: "Zero regrets",
};

const RECT = { left: 0, top: 0, width: 200, height: 100 } as DOMRect;

const renderShapes = () => {
	const { container } = render(<CtaShapesClient {...COPY} />);
	const surface = container.firstElementChild as HTMLElement;
	vi.spyOn(surface, "getBoundingClientRect").mockReturnValue(RECT);
	return surface;
};

const offsets = () => shapes.styles.slice(-4).map(({ x, y }) => ({ x: Math.round(x.get()), y: Math.round(y.get()) }));

const CENTRED = [
	{ x: 0, y: 0 },
	{ x: 0, y: 0 },
	{ x: 0, y: 0 },
	{ x: 0, y: 0 },
];

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

beforeEach(() => {
	shapes.styles.length = 0;
});

describe("CtaShapesClient", () => {
	it("carries the copy it was handed, since it holds no strings of its own", () => {
		renderShapes();

		expect(screen.getByText(COPY.byeMonday)).toBeTruthy();
		expect(screen.getByText(COPY.bossOff)).toBeTruthy();
		expect(screen.getByText(COPY.doNotDisturb)).toBeTruthy();
		expect(screen.getByText(COPY.zeroRegrets)).toBeTruthy();
	});

	it("is decoration, so it is hidden from a reader and takes no pointer of its own", () => {
		const surface = renderShapes();

		expect(surface.getAttribute("aria-hidden")).toBe("true");
		expect(shapes.styles).toHaveLength(4);
		expect(document.querySelectorAll(".pointer-events-none")).toHaveLength(4);
	});

	it("rests dead centre before the pointer has been anywhere", () => {
		renderShapes();

		expect(offsets()).toStrictEqual(CENTRED);
	});

	it("moves the shapes against each other, which is what reads as depth", async () => {
		const surface = renderShapes();

		fireEvent.mouseMove(surface, { clientX: 200, clientY: 100 });
		await settle();

		expect(offsets()).toStrictEqual([
			{ x: 14, y: 10 },
			{ x: -10, y: 16 },
			{ x: 20, y: -12 },
			{ x: -16, y: 8 },
		]);
	});

	it("mirrors the whole set when the pointer goes to the opposite corner", async () => {
		const surface = renderShapes();

		fireEvent.mouseMove(surface, { clientX: 0, clientY: 0 });
		await settle();

		expect(offsets()).toStrictEqual([
			{ x: -14, y: -10 },
			{ x: 10, y: -16 },
			{ x: -20, y: 12 },
			{ x: 16, y: -8 },
		]);
	});

	it("reads the pointer against its own box rather than against the page", async () => {
		const surface = renderShapes();

		fireEvent.mouseMove(surface, { clientX: 100, clientY: 50 });
		await settle();

		expect(offsets()).toStrictEqual(CENTRED);
	});

	it("drifts back to centre when the pointer leaves", async () => {
		const surface = renderShapes();
		fireEvent.mouseMove(surface, { clientX: 200, clientY: 100 });
		await settle();
		expect(offsets()).not.toStrictEqual(CENTRED);

		fireEvent.mouseLeave(surface);
		await settle();

		expect(offsets()).toStrictEqual(CENTRED);
	});
});
