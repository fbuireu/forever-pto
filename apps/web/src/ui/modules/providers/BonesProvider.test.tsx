import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const configureBoneyard = vi.hoisted(() => vi.fn());

vi.mock("boneyard-js/react", () => ({ configureBoneyard }));
vi.mock("src/ui/modules/bones/registry", () => ({}));

const { BonesProvider } = await import("./BonesProvider");

describe("BonesProvider", () => {
	it("configures the skeletons when the module loads, before any bone can render", () => {
		expect(configureBoneyard).toHaveBeenCalledOnce();
		expect(configureBoneyard.mock.calls[0]?.[0]).toMatchObject({
			animate: "shimmer",
			boneClass: "boneyard-bordered",
			transition: true,
		});
	});

	it("names a light and a dark colour for both the bone and its shimmer", () => {
		const config = configureBoneyard.mock.calls[0]?.[0] as Record<string, string>;

		expect(config.color).not.toBe(config.darkColor);
		expect(config.shimmerColor).not.toBe(config.darkShimmerColor);
	});

	it("renders nothing itself, and configures nothing more on mount", () => {
		const { container } = render(<BonesProvider />);

		expect(container.childNodes).toHaveLength(0);
		expect(configureBoneyard).toHaveBeenCalledOnce();
	});
});
