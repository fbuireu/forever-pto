import { CA, DE, EN, ES, FR, IT, LOCALES } from "@infrastructure/i18n/locales";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSetRequestLocale = vi.fn();
const mockGetTranslations = vi.fn().mockResolvedValue((key: string) => key);
const mockGetMessages = vi.fn().mockResolvedValue({ a11y: { skipToMainContent: "Skip" }, homepage: { title: "Home" } });

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
	getMessages: mockGetMessages,
	setRequestLocale: mockSetRequestLocale,
}));
vi.mock("next-intl", async (importOriginal) => ({
	...(await importOriginal<typeof import("next-intl")>()),
	NextIntlClientProvider: ({ children }: { children: unknown }) => children,
}));
const MockStripePreload = vi.fn().mockReturnValue(null);

vi.mock("@ui/modules/providers/BonesProvider", () => ({ BonesProvider: () => null }));
vi.mock("@ui/modules/providers/StripePreload", () => ({ StripePreload: MockStripePreload }));
vi.mock("@ui/modules/shared/cookie-consent/CookieConsentClient", () => ({ CookieConsentClient: () => null }));
vi.mock("@ui/modules/shared/WebMCP", () => ({ WebMCP: () => null }));
vi.mock("@ui/modules/tracking/Analytics", () => ({ Analytics: () => null }));
vi.mock("@ui/modules/tracking/BetterStackTracking", () => ({ BetterStackTracking: () => null }));
vi.mock("@ui/modules/core/animate/providers/LazyMotionProvider", () => ({
	LazyMotionProvider: ({ children }: { children: unknown }) => children,
}));
vi.mock("@ui/modules/providers/AppThemeProvider", () => ({
	AppThemeProvider: ({ children }: { children: unknown }) => children,
}));
vi.mock("@styles/index.css", () => ({}));
vi.mock("@app/fonts", () => ({
	DOCUMENT_BODY_CLASS: "var-bricolage var-space-grotesk var-instrument-serif var-jetbrains-mono font-sans antialiased",
}));

const { default: Layout, dynamicParams, generateStaticParams } = await import("./layout");

describe("[locale]/layout", () => {
	beforeEach(() => vi.clearAllMocks());

	describe("generateStaticParams", () => {
		it("returns one entry per locale", () => {
			expect(generateStaticParams()).toHaveLength(LOCALES.length);
		});

		it("covers all supported locales", () => {
			const locales = generateStaticParams().map((p) => p.locale);
			expect(locales).toEqual(expect.arrayContaining([CA, IT, EN, ES, FR, DE]));
		});

		it("serves those locales alone, so a first segment no locale claims answers 404 before the layout runs", () => {
			expect(dynamicParams).toBe(false);
		});
	});

	describe("Layout", () => {
		it("renders a segment no locale claims in the default language, since only the catch-all can hand it one and that page answers 404", async () => {
			const element = await Layout({ children: null, params: Promise.resolve({ locale: "wp-admin" }) });

			expect(mockSetRequestLocale).toHaveBeenCalledExactlyOnceWith(EN);
			expect(element.props.lang).toBe(EN);
		});

		it("calls setRequestLocale with the resolved locale", async () => {
			await Layout({ children: null, params: Promise.resolve({ locale: ES }) });
			expect(mockSetRequestLocale).toHaveBeenCalledWith(ES);
		});

		it("sets the lang attribute on the html element", async () => {
			const element = await Layout({ children: null, params: Promise.resolve({ locale: ES }) });
			expect(element.props.lang).toBe(ES);
		});

		it("mounts the Stripe.js load on every page it wraps, so Stripe's fraud signals see the visit before a payment", async () => {
			const typesIn = (node: unknown): unknown[] => {
				if (!node || typeof node !== "object") return [];
				const { type, props } = node as { type?: unknown; props?: { children?: unknown } };
				return [type, ...[props?.children].flat().flatMap(typesIn)];
			};

			const element = await Layout({ children: null, params: Promise.resolve({ locale: EN }) });

			expect(typesIn(element)).toContain(MockStripePreload);
		});

		it("hands the client provider every namespace but the ones only the server reads", async () => {
			interface Node {
				props?: { children?: unknown; messages?: unknown };
			}
			const find = (node: unknown): Node | undefined => {
				if (!node || typeof node !== "object") return undefined;
				const { props } = node as Node;
				if (props && "messages" in props) return node as Node;
				return [props?.children].flat().map(find).find(Boolean);
			};

			const element = await Layout({ children: null, params: Promise.resolve({ locale: EN }) });

			expect(find(element)?.props?.messages).toEqual({ a11y: { skipToMainContent: "Skip" } });
		});
	});
});
