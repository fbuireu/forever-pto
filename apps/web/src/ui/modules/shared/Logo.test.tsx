import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("@ui/hooks/useMobile", () => ({ useIsMobile: () => false }));
vi.mock("@ui/modules/core/animate/base/Sidebar", () => ({
	useSidebar: () => ({ state: "expanded", setOpenMobile: vi.fn() }),
}));
vi.mock("next/image", () => ({ default: () => null }));

const { Logo } = await import("./Logo");

describe("Logo", () => {
	it("keeps a focus ring, being the first thing a keyboard reaches after the skip link", () => {
		render(<Logo />);

		expect(screen.getByRole("link", { name: "Forever PTO" }).className).toContain("focus-visible:ring-[3px]");
	});
});
