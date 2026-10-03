import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, describe, expect, it, vi } from "vitest";

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

vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "G-TEST123");

afterAll(() => {
	vi.unstubAllEnvs();
});

const { Analytics } = await import("./Analytics");

const scriptsOf = (container: HTMLElement) => [...container.querySelectorAll("script")];
interface ScriptNamedParams {
	container: HTMLElement;
	id: string;
}

const scriptNamed = ({ container, id }: ScriptNamedParams) => {
	const script = scriptsOf(container).find((candidate) => candidate.getAttribute("data-testid") === id);
	if (!script) throw new Error(`script ${id} not rendered`);
	return script;
};

describe("Analytics", () => {
	it("denies every storage category before the tag itself loads", () => {
		const { container } = render(<Analytics />);
		const consent = scriptNamed({ container, id: "gtag-consent" }).textContent ?? "";

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

		expect(scriptNamed({ container, id: "gtag-js" }).getAttribute("data-src")).toBe(
			"https://www.googletagmanager.com/gtag/js?id=G-TEST123",
		);
		expect(scriptNamed({ container, id: "gtag-config" }).textContent).toContain("gtag('config', 'G-TEST123')");
	});

	it("waits for hydration before any of the three run", () => {
		const { container } = render(<Analytics />);

		expect(scriptsOf(container).every((script) => script.getAttribute("data-strategy") === "afterInteractive")).toBe(
			true,
		);
	});
});

describe("Analytics without a property", () => {
	it("renders nothing, rather than requesting a tag for an undefined id", async () => {
		vi.resetModules();
		vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "");
		const { Analytics: Unconfigured } = await import("./Analytics");

		const { container } = render(<Unconfigured />);

		expect(container.querySelectorAll("script")).toHaveLength(0);
	});
});
