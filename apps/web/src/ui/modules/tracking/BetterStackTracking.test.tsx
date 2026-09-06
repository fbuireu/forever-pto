import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAcceptedService, mockIdentifyUser, mockTrackingEnvironment } = vi.hoisted(() => ({
	mockAcceptedService: vi.fn(),
	mockIdentifyUser: vi.fn(),
	mockTrackingEnvironment: vi.fn(() => "development"),
}));

vi.mock("vanilla-cookieconsent", () => ({
	acceptedService: mockAcceptedService,
	acceptedCategory: vi.fn(() => true),
}));

vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({
	identifyUser: mockIdentifyUser,
	trackingEnvironment: mockTrackingEnvironment,
}));

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: unknown) => unknown) => selector({ userEmail: null, premiumKey: null }),
}));

vi.mock("next/script", () => ({
	default: ({ children, id }: { children?: ReactNode; id?: string }) => <script data-testid={id}>{children}</script>,
}));

process.env.NEXT_PUBLIC_BETTER_STACK_TRACKING_TOKEN = "test-token";

const { BetterStackTracking } = await import("./BetterStackTracking");
const { version } = await import("../../../../package.json");

beforeEach(() => {
	vi.clearAllMocks();
	mockAcceptedService.mockReturnValue(false);
	mockTrackingEnvironment.mockReturnValue("development");
});

describe("BetterStackTracking", () => {
	it("renders nothing while the betterStack service is refused", () => {
		const { container } = render(<BetterStackTracking />);

		expect(container.querySelector("script")).toBeNull();
		expect(mockAcceptedService).toHaveBeenCalledWith("betterStack", "analytics");
	});

	it("mounts the snippet on a consent event dispatched on window", () => {
		const { container } = render(<BetterStackTracking />);
		expect(container.querySelector("script")).toBeNull();

		mockAcceptedService.mockReturnValue(true);
		act(() => {
			window.dispatchEvent(new CustomEvent("cc:onChange"));
		});

		expect(container.querySelector("script")).not.toBeNull();
	});

	it("configures the release from the package version and the environment from the hostname", () => {
		mockTrackingEnvironment.mockReturnValue("production");
		mockAcceptedService.mockReturnValue(true);
		const { container } = render(<BetterStackTracking />);
		act(() => {
			window.dispatchEvent(new CustomEvent("cc:onConsent"));
		});

		const snippet = container.querySelector("script")?.textContent ?? "";
		expect(mockTrackingEnvironment).toHaveBeenCalledWith(window.location.hostname);
		expect(snippet).toContain(`betterstack('config', { release: '${version}' })`);
		expect(snippet).toContain("betterstack('init', { environment: 'production' })");
		expect(snippet).toContain("b.js?t='+r");
		expect(snippet).toContain("'betterstack','test-token'");
	});

	it("ignores an event dispatched on document, which the library never uses", () => {
		const { container } = render(<BetterStackTracking />);

		mockAcceptedService.mockReturnValue(true);
		act(() => {
			document.dispatchEvent(new CustomEvent("cc:onChange"));
		});

		expect(container.querySelector("script")).toBeNull();
	});
});
