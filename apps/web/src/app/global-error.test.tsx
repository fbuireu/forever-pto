import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import enMessages from "@i18n/messages/en.json";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.hoisted(() => vi.fn(() => "/en/planner"));
const MockErrorContent = vi.hoisted(() => vi.fn().mockReturnValue(null));

vi.mock("next/navigation", () => ({ usePathname: mockUsePathname }));
vi.mock("@ui/modules/pages/error/ErrorContent", () => ({ ErrorContent: MockErrorContent }));
vi.mock("@ui/modules/core/animate/providers/LazyMotionProvider", () => ({
	LazyMotionProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@ui/modules/providers/AppThemeProvider", () => ({
	AppThemeProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("next-intl", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next-intl")>();
	return {
		...actual,
		NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
	};
});
vi.mock("@app/fonts", () => ({
	DOCUMENT_BODY_CLASS: "bricolage-var space-grotesk-var instrument-serif-var jetbrains-mono-var font-sans antialiased",
}));
vi.mock("@styles/index.css", () => ({}));

const { default: GlobalError } = await import("./global-error");

const mockError = Object.assign(new Error("catastrophic failure"), { digest: "xyz789" });
const mockReset = vi.fn();

describe("global-error", () => {
	it("declares English on <html lang>, because English is the only catalogue it bundles", () => {
		mockUsePathname.mockReturnValue("/es/planner");
		const element = GlobalError({ error: mockError, reset: mockReset });
		expect(element.type).toBe("html");
		expect(element.props.lang).toBe("en");
	});

	it("declares English regardless of the locale in the pathname", () => {
		for (const pathname of ["/", "", "/de/planner", "/fr"]) {
			mockUsePathname.mockReturnValue(pathname);
			expect(GlobalError({ error: mockError, reset: mockReset }).props.lang).toBe("en");
		}
	});

	it("renders a body element with font variables", () => {
		mockUsePathname.mockReturnValue("/en");
		const element = GlobalError({ error: mockError, reset: mockReset });
		const body = element.props.children;
		expect(body.type).toBe("body");
		expect(body.props.className).toContain("bricolage-var");
	});

	it("supplies the error copy in the language it declares on <html lang>", () => {
		mockUsePathname.mockReturnValue("/de/planner");
		const element = GlobalError({ error: mockError, reset: mockReset });
		const nextIntl = element.props.children.props.children;
		expect(element.props.lang).toBe("en");
		expect(nextIntl.props.messages.error).toEqual(enMessages.error);
	});

	it("bundles exactly one catalogue — importing all six costs every route ~500 KB", () => {
		const source = readFileSync(resolve(process.cwd(), "src/app/global-error.tsx"), "utf8");
		const catalogues = source.match(/from ["']@i18n\/messages\/\w+\.json["']/g) ?? [];
		expect(catalogues.map((match) => match.replace(/.*\/(\w+)\.json.*/, "$1"))).toEqual(["en"]);
	});

	it("falls back to the English copy when the pathname carries no locale", () => {
		mockUsePathname.mockReturnValue("/");
		const element = GlobalError({ error: mockError, reset: mockReset });
		const nextIntl = element.props.children.props.children;
		expect(nextIntl.props.messages.error).toEqual(enMessages.error);
	});

	it("forwards error and reset to ErrorContent", () => {
		mockUsePathname.mockReturnValue("/en");
		const element = GlobalError({ error: mockError, reset: mockReset });
		const body = element.props.children;
		const nextIntl = body.props.children;
		const themeProvider = nextIntl.props.children;
		const motionProvider = themeProvider.props.children;
		const wrapper = motionProvider.props.children;
		const errorContent = wrapper.props.children;
		expect(errorContent.props.error).toBe(mockError);
		expect(errorContent.props.reset).toBe(mockReset);
	});
});
