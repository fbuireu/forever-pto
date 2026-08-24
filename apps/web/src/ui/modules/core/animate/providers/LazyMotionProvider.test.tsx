import { render } from "@testing-library/react";
import { hasReducedMotionListener, prefersReducedMotion, useReducedMotionConfig } from "motion/react";
import { describe, expect, it } from "vitest";
import { LazyMotionProvider } from "./LazyMotionProvider";

const Probe = () => <span data-testid="probe">{String(useReducedMotionConfig())}</span>;

const renderWithSystemPreference = (reduce: boolean) => {
	hasReducedMotionListener.current = true;
	prefersReducedMotion.current = reduce;

	return render(
		<LazyMotionProvider>
			<Probe />
		</LazyMotionProvider>,
	);
};

describe("LazyMotionProvider", () => {
	it("hands every motion component the user's reduced-motion setting, which no CSS override can reach", () => {
		expect(renderWithSystemPreference(true).getByTestId("probe").textContent).toBe("true");
	});

	it("leaves motion alone when the user asked for none of it", () => {
		expect(renderWithSystemPreference(false).getByTestId("probe").textContent).toBe("false");
	});
});
