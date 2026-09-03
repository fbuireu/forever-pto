import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

type Loader = () => Promise<{ default: unknown }>;

const { dynamic, MockPremiumRequiredModal } = vi.hoisted(() => ({
	dynamic: { loader: undefined as Loader | undefined },
	MockPremiumRequiredModal: vi.fn().mockReturnValue(null),
}));

const premiumState = {
	closeModal: vi.fn(),
	verifyEmail: vi.fn(),
	modalOpen: true,
	currentFeature: "calendarExport",
	isLoading: true,
};

interface ModalProps {
	open: boolean;
	onClose: () => void;
	feature: string | null;
	onVerifyEmail: (email: string) => void;
	isLoading: boolean;
}

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
}));
vi.mock("./PremiumRequiredModal", () => ({ PremiumRequiredModal: MockPremiumRequiredModal }));
vi.mock("next/dynamic", () => ({
	default: (loader: Loader) => {
		dynamic.loader = loader;
		return (props: ModalProps) => (
			<div
				data-testid="modal"
				data-open={String(props.open)}
				data-feature={props.feature}
				data-loading={String(props.isLoading)}
			>
				<button type="button" onClick={props.onClose}>
					close
				</button>
				<button type="button" onClick={() => props.onVerifyEmail("donor@example.com")}>
					verify
				</button>
			</div>
		);
	},
}));

const { PremiumModal } = await import("./PremiumModal");

describe("PremiumModal", () => {
	it("mirrors the store's open state, gated feature and loading flag onto the dialog", () => {
		render(<PremiumModal />);
		const modal = screen.getByTestId("modal");

		expect(modal.getAttribute("data-open")).toBe("true");
		expect(modal.getAttribute("data-feature")).toBe("calendarExport");
		expect(modal.getAttribute("data-loading")).toBe("true");
	});

	it("closes through the store, which is what every gate reads", () => {
		render(<PremiumModal />);

		fireEvent.click(screen.getByRole("button", { name: "close" }));

		expect(premiumState.closeModal).toHaveBeenCalledOnce();
	});

	it("loads the real dialog behind the split, so the form ships only once a gate is clicked", async () => {
		render(<PremiumModal />);

		expect((await dynamic.loader?.())?.default).toBe(MockPremiumRequiredModal);
	});

	it("verifies the address through the store action rather than a local fetch", () => {
		render(<PremiumModal />);

		fireEvent.click(screen.getByRole("button", { name: "verify" }));

		expect(premiumState.verifyEmail).toHaveBeenCalledExactlyOnceWith("donor@example.com");
	});
});
