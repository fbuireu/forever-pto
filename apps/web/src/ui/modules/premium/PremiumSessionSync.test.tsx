import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const confirmActivation = vi.fn().mockResolvedValue(undefined);
const checkExistingSession = vi.fn().mockResolvedValue(undefined);

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (
		selector: (state: {
			confirmActivation: typeof confirmActivation;
			checkExistingSession: typeof checkExistingSession;
		}) => unknown,
	) => selector({ confirmActivation, checkExistingSession }),
}));

import { PremiumSessionSync } from "./PremiumSessionSync";

beforeEach(() => {
	confirmActivation.mockClear();
	checkExistingSession.mockClear();
});

describe("PremiumSessionSync", () => {
	it("confirms the activation the payment route reported, once, on mount", () => {
		render(<PremiumSessionSync />);

		expect(confirmActivation).toHaveBeenCalledExactlyOnceWith();
	});

	it("runs the confirmation rather than a plain session check, which would restore Premium without counting it", () => {
		render(<PremiumSessionSync />);

		expect(checkExistingSession).not.toHaveBeenCalled();
	});

	it("confirms once even under strict mode's doubled effects, so the cookie is not read twice", () => {
		render(
			<StrictMode>
				<PremiumSessionSync />
			</StrictMode>,
		);

		expect(confirmActivation).toHaveBeenCalledOnce();
	});

	it("does not confirm again on a re-render", () => {
		const { rerender } = render(<PremiumSessionSync />);

		rerender(<PremiumSessionSync />);

		expect(confirmActivation).toHaveBeenCalledOnce();
	});

	it("renders nothing", () => {
		const { container } = render(<PremiumSessionSync />);

		expect(container.childNodes).toHaveLength(0);
	});
});
