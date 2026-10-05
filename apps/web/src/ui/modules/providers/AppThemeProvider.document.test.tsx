import { BONES_COLORS } from "@styles/palette";
import { act, render, waitFor } from "@testing-library/react";
import { Skeleton } from "boneyard-js/react";
import { useTheme } from "next-themes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ui/modules/bones/registry", () => ({}));

import { AppThemeProvider } from "./AppThemeProvider";

await import("./BonesProvider");

const THEME_KEY = "theme";
const PROBE_BONES = { name: "probe", viewportWidth: 1000, width: 1000, height: 100, bones: [[0, 0, 50, 50, 8]] };

const html = () => document.documentElement;

const ToggleTheme = () => {
	const { resolvedTheme, setTheme } = useTheme();
	return (
		<button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
			toggle
		</button>
	);
};

const runInlineScript = (container: HTMLElement) => {
	const script = container.ownerDocument.querySelector("script");
	new Function(script?.textContent ?? "")();
};

const resetDocument = () => {
	html().removeAttribute("class");
	html().removeAttribute("data-theme");
	html().removeAttribute("style");
	localStorage.clear();
};

const systemPrefersDark = (dark: boolean) =>
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches: dark && query.includes("dark"),
		media: query,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
	}));

beforeEach(resetDocument);

afterEach(() => {
	vi.unstubAllGlobals();
	resetDocument();
});

describe("what the theme script writes to <html> before the first paint", () => {
	const written = () => ({
		attribute: html().getAttribute("data-theme"),
		classes: [...html().classList],
		scheme: html().style.colorScheme,
	});

	it("writes the light theme as both the attribute and the class when nothing is stored", () => {
		const { container } = render(<AppThemeProvider>child</AppThemeProvider>);
		resetDocument();

		runInlineScript(container);

		expect(written()).toStrictEqual({ attribute: "light", classes: ["light"], scheme: "light" });
	});

	it("writes a stored dark theme as both, with the colour scheme, so no frame is drawn light", () => {
		localStorage.setItem(THEME_KEY, "dark");
		const { container } = render(<AppThemeProvider>child</AppThemeProvider>);
		resetDocument();
		localStorage.setItem(THEME_KEY, "dark");

		runInlineScript(container);

		expect(written()).toStrictEqual({ attribute: "dark", classes: ["dark"], scheme: "dark" });
	});

	it("resolves the system theme to dark or light before writing either", () => {
		systemPrefersDark(true);
		const { container } = render(<AppThemeProvider>child</AppThemeProvider>);
		resetDocument();
		localStorage.setItem(THEME_KEY, "system");

		runInlineScript(container);

		expect(written()).toStrictEqual({ attribute: "dark", classes: ["dark"], scheme: "dark" });
	});

	it("keeps whatever other classes <html> carries, and swaps only the theme's own", () => {
		const { container } = render(<AppThemeProvider>child</AppThemeProvider>);
		resetDocument();
		html().className = "kept dark";
		localStorage.setItem(THEME_KEY, "light");

		runInlineScript(container);

		expect(written().classes.toSorted()).toStrictEqual(["kept", "light"]);
	});
});

describe("what the provider keeps on <html> once React has mounted", () => {
	it("carries the stored theme as the attribute and the class together", async () => {
		localStorage.setItem(THEME_KEY, "dark");

		render(<AppThemeProvider>child</AppThemeProvider>);

		await waitFor(() => expect(html().classList.contains("dark")).toBe(true));
		expect(html().getAttribute("data-theme")).toBe("dark");
		expect(html().classList.contains("light")).toBe(false);
	});

	it("swaps the class and the attribute in one move when the theme changes", async () => {
		localStorage.setItem(THEME_KEY, "dark");
		const { getByRole } = render(
			<AppThemeProvider>
				<ToggleTheme />
			</AppThemeProvider>,
		);
		await waitFor(() => expect(html().classList.contains("dark")).toBe(true));

		await act(async () => getByRole("button").click());

		expect(html().getAttribute("data-theme")).toBe("light");
		expect([...html().classList]).toStrictEqual(["light"]);
	});
});

describe("a boneyard-js skeleton on a page this provider themes", () => {
	const bone = () => document.querySelector<HTMLElement>("[data-boneyard-bone]");
	const paintOf = () => bone()?.getAttribute("style") ?? "";
	const hexOf = (hex: string) => {
		const [red, green, blue] = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
		return `rgb(${red}, ${green}, ${blue})`;
	};
	const paints = (hex: string) => paintOf().includes(hex) || paintOf().includes(hexOf(hex));

	const skeleton = () => (
		<AppThemeProvider>
			<Skeleton name="probe" loading initialBones={PROBE_BONES} fixture={<span />} fallback={<span />}>
				<span>content</span>
			</Skeleton>
		</AppThemeProvider>
	);

	it("draws its light colours on a light page", async () => {
		localStorage.setItem(THEME_KEY, "light");

		render(skeleton());

		await waitFor(() => expect(bone()).not.toBeNull());
		expect(paints(BONES_COLORS.color)).toBe(true);
		expect(paints(BONES_COLORS.darkColor)).toBe(false);
	});

	it("draws its dark colours on a dark page, which it reads from the class on <html>", async () => {
		localStorage.setItem(THEME_KEY, "dark");

		render(skeleton());

		await waitFor(() => expect(paints(BONES_COLORS.darkColor)).toBe(true));
		expect(paints(BONES_COLORS.color)).toBe(false);
	});

	it("turns dark with the page when the visitor switches the theme under it", async () => {
		localStorage.setItem(THEME_KEY, "light");
		const { getByRole } = render(
			<AppThemeProvider>
				<ToggleTheme />
				<Skeleton name="probe" loading initialBones={PROBE_BONES} fixture={<span />} fallback={<span />}>
					<span>content</span>
				</Skeleton>
			</AppThemeProvider>,
		);
		await waitFor(() => expect(paints(BONES_COLORS.color)).toBe(true));

		await act(async () => getByRole("button").click());

		await waitFor(() => expect(paints(BONES_COLORS.darkColor)).toBe(true));
	});
});
