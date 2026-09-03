import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

interface ScriptProps {
	children?: ReactNode;
	id?: string;
	src?: string;
	strategy?: string;
}

vi.mock("next/script", () => ({
	default: ({ children, id, src, strategy }: ScriptProps) => (
		<script data-testid={id} data-src={src} data-strategy={strategy}>
			{children}
		</script>
	),
}));

process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID = "G-TEST123";

const { Analytics } = await import("./Analytics");

const scriptsOf = (container: HTMLElement) => [...container.querySelectorAll("script")];
const scriptNamed = (container: HTMLElement, id: string) => {
	const script = scriptsOf(container).find((candidate) => candidate.getAttribute("data-testid") === id);
	if (!script) throw new Error(`script ${id} not rendered`);
	return script;
};

describe("Analytics", () => {
	it("denies every storage category before the tag itself loads", () => {
		const { container } = render(<Analytics />);
		const consent = scriptNamed(container, "gtag-consent").textContent ?? "";

		for (const category of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
			expect(consent).toContain(`'${category}': 'denied'`);
		}
		expect(scriptsOf(container).map((script) => script.getAttribute("data-testid"))).toEqual([
			"gtag-consent",
			"gtag-js",
			"gtag-config",
		]);
	});

	it("loads and configures the property named by the public variable", () => {
		const { container } = render(<Analytics />);

		expect(scriptNamed(container, "gtag-js").getAttribute("data-src")).toBe(
			"https://www.googletagmanager.com/gtag/js?id=G-TEST123",
		);
		expect(scriptNamed(container, "gtag-config").textContent).toContain("gtag('config', 'G-TEST123')");
	});

	it("waits for hydration before any of the three run", () => {
		const { container } = render(<Analytics />);

		expect(scriptsOf(container).every((script) => script.getAttribute("data-strategy") === "afterInteractive")).toBe(
			true,
		);
	});
});
