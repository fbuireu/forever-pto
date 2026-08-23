import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { ConditionalWrapper } from "./ConditionalWrapper";

const frame = (children: ReactNode) => <div data-testid="frame">{children}</div>;

describe("ConditionalWrapper", () => {
	it("hands the children to the wrapper when asked", () => {
		const { getByTestId } = render(
			<ConditionalWrapper doWrap wrapper={frame}>
				<span>day</span>
			</ConditionalWrapper>,
		);

		expect(getByTestId("frame").textContent).toBe("day");
	});

	it("renders the children bare otherwise, adding no element of its own", () => {
		const { container, queryByTestId } = render(
			<ConditionalWrapper doWrap={false} wrapper={frame}>
				<span>day</span>
			</ConditionalWrapper>,
		);

		expect(queryByTestId("frame")).toBeNull();
		expect(container.innerHTML).toBe("<span>day</span>");
	});
});
