import { ACTIVATION_PARAM } from "@application/dto/payment/types";
import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmActivation = vi.fn<() => Promise<void>>();
const checkExistingSession = vi.fn<(force?: boolean) => Promise<void>>();

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (
		selector: (state: {
			confirmActivation: typeof confirmActivation;
			checkExistingSession: typeof checkExistingSession;
		}) => unknown,
	) => selector({ confirmActivation, checkExistingSession }),
}));

import { PremiumSessionSync } from "./PremiumSessionSync";

const PAGE = "/payment/confirmation";
const LANDING = `${PAGE}?payment_intent=pi_probe`;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
	confirmActivation.mockReset().mockResolvedValue(undefined);
	checkExistingSession.mockReset().mockResolvedValue(undefined);
	window.history.replaceState(null, "", LANDING);
});

afterEach(() => {
	vi.restoreAllMocks();
	window.history.replaceState(null, "", "/");
});

describe("PremiumSessionSync", () => {
	it("asks the store to confirm the activation once, on mount, which reports it only with the activation route's proof", async () => {
		render(<PremiumSessionSync />);
		await flush();

		expect(confirmActivation).toHaveBeenCalledExactlyOnceWith();
		expect(checkExistingSession).not.toHaveBeenCalled();
	});

	it("confirms once even under strict mode's doubled effects", async () => {
		render(
			<StrictMode>
				<PremiumSessionSync />
			</StrictMode>,
		);
		await flush();

		expect(confirmActivation).toHaveBeenCalledOnce();
	});

	it("does not confirm again on a re-render", async () => {
		const { rerender } = render(<PremiumSessionSync />);

		rerender(<PremiumSessionSync />);
		await flush();

		expect(confirmActivation).toHaveBeenCalledOnce();
	});

	it("leaves the address alone, a marker an older redirect wrote included, since the proof is a cookie and not the address", async () => {
		const marked = `${LANDING}&${ACTIVATION_PARAM}=fresh#receipt`;
		window.history.replaceState(null, "", marked);
		const replace = vi.spyOn(window.history, "replaceState");
		const push = vi.spyOn(window.history, "pushState");

		render(<PremiumSessionSync />);
		await flush();

		expect(replace).not.toHaveBeenCalled();
		expect(push).not.toHaveBeenCalled();
		expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(marked);
		expect(confirmActivation).toHaveBeenCalledOnce();
	});

	it("renders nothing", () => {
		const { container } = render(<PremiumSessionSync />);

		expect(container.childNodes).toHaveLength(0);
	});
});
