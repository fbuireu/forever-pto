import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@styles/lazy/index.css", () => ({}));

const { DriverStyles } = await import("./DriverStyles");

describe("DriverStyles", () => {
	it("renders nothing, existing only to pull the tour stylesheet into the client bundle", () => {
		const { container } = render(<DriverStyles />);

		expect(container.childNodes).toHaveLength(0);
	});
});
