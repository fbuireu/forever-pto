import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const checkExistingSession = vi.fn().mockResolvedValue(undefined);

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: { checkExistingSession: typeof checkExistingSession }) => unknown) =>
		selector({ checkExistingSession }),
}));

import { PremiumSessionSync } from "./PremiumSessionSync";

beforeEach(() => {
	checkExistingSession.mockClear();
});

describe("PremiumSessionSync", () => {
	it("forces one session check on mount, bypassing the store's own throttle", () => {
		render(<PremiumSessionSync />);

		expect(checkExistingSession).toHaveBeenCalledExactlyOnceWith({ force: true });
	});

	it("checks once even under strict mode's doubled effects, so the cookie is not read twice", () => {
		render(
			<StrictMode>
				<PremiumSessionSync />
			</StrictMode>,
		);

		expect(checkExistingSession).toHaveBeenCalledOnce();
	});

	it("does not check again on a re-render", () => {
		const { rerender } = render(<PremiumSessionSync />);

		rerender(<PremiumSessionSync />);

		expect(checkExistingSession).toHaveBeenCalledOnce();
	});

	it("renders nothing", () => {
		const { container } = render(<PremiumSessionSync />);

		expect(container.childNodes).toHaveLength(0);
	});
});
