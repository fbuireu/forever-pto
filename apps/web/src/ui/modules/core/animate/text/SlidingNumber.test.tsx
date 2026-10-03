import { render } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

type MotionSpanProps = ComponentProps<"span"> & { style?: unknown; transition?: unknown };

const springStarts = vi.hoisted((): number[] => []);

vi.mock("motion/react", async () => {
	const { createElement } = await import("react");
	return {
		m: {
			span: ({ children, style: _s, transition: _t, ...props }: MotionSpanProps) =>
				createElement("span", props, children),
		},
		useInView: () => true,
		useSpring: (initial: number) => {
			springStarts.push(initial);
			return { set: vi.fn() };
		},
		useTransform: () => 0,
	};
});

vi.mock("react-use-measure", () => ({ default: () => [vi.fn(), { height: 0 }] }));

import { SlidingNumber } from "./SlidingNumber";

interface RenderInParams {
	locale: Locale;
	children: ReactNode;
}

const renderIn = ({ locale, children }: RenderInParams) =>
	render(<NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>);

const separatorOf = (container: HTMLElement) =>
	container.querySelector('[data-slot="sliding-number"]')?.textContent ?? "";

describe("SlidingNumber", () => {
	it("uses the comma decimal separator in a comma-decimal locale", () => {
		const { container } = renderIn({ locale: "es", children: <SlidingNumber number={2.4} decimalPlaces={1} /> });
		expect(separatorOf(container)).toContain(",");
	});

	it("uses the dot decimal separator in a dot-decimal locale", () => {
		const { container } = renderIn({ locale: "en", children: <SlidingNumber number={2.4} decimalPlaces={1} /> });
		expect(separatorOf(container)).toContain(".");
		expect(separatorOf(container)).not.toContain(",");
	});

	it("honours an explicit decimalSeparator over the locale default", () => {
		const { container } = renderIn({
			locale: "es",
			children: <SlidingNumber number={2.4} decimalPlaces={1} decimalSeparator="·" />,
		});
		expect(separatorOf(container)).toContain("·");
		expect(separatorOf(container)).not.toContain(",");
	});

	it("renders no separator when there are no decimals", () => {
		const { container } = renderIn({ locale: "de", children: <SlidingNumber number={2026} /> });
		expect(separatorOf(container)).not.toContain(",");
		expect(separatorOf(container)).not.toContain(".");
	});
});

describe("SlidingNumber rollers", () => {
	it("rolls every digit up from nought the first time it shows a number", () => {
		springStarts.length = 0;
		renderIn({ locale: "en", children: <SlidingNumber number={47} /> });

		expect(springStarts).toEqual([0, 0]);
	});

	it("hands every roller the number it moved from until the number moves again", () => {
		const showing = (number: number) => (
			<NextIntlClientProvider locale="en">
				<SlidingNumber number={number} />
			</NextIntlClientProvider>
		);
		const { rerender } = render(showing(9));
		springStarts.length = 0;

		rerender(showing(10));
		rerender(showing(10));

		expect(springStarts).toEqual([0, 9, 0, 9]);
	});
});
