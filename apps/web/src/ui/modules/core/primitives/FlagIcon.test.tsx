import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlagIcon } from "./FlagIcon";

describe("FlagIcon", () => {
	it("renders nothing for an empty code rather than a flag for nowhere", () => {
		const { container } = render(<FlagIcon code="" />);

		expect(container.firstChild).toBeNull();
	});

	it("renders the sprite class for the code, hidden from assistive tech", () => {
		const { container } = render(<FlagIcon code="es" />);

		const flag = container.firstElementChild as HTMLElement;
		expect(flag.tagName).toBe("SPAN");
		expect(flag.classList.contains("fi")).toBe(true);
		expect(flag.classList.contains("fi-es")).toBe(true);
		expect(flag.getAttribute("aria-hidden")).toBe("true");
	});

	it("appends the caller's className", () => {
		const { container } = render(<FlagIcon code="fr" className="size-5" />);

		expect((container.firstElementChild as HTMLElement).className).toContain("size-5");
	});
});
