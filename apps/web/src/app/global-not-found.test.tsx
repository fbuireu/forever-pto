import enMessages from "@i18n/messages/en.json";
import { clientMessagesOf } from "@infrastructure/i18n/clientMessages";
import { routing } from "@infrastructure/i18n/routing";
import { createTranslator, type Locale } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeaders, mockCookies, mockGetTranslations, mockGetMessages, mockSetRequestLocale } = vi.hoisted(() => ({
	mockHeaders: vi.fn(),
	mockCookies: vi.fn(),
	mockGetTranslations: vi.fn(),
	mockGetMessages: vi.fn(),
	mockSetRequestLocale: vi.fn(),
}));

const MockHeader = vi.hoisted(() => vi.fn().mockReturnValue(null));
const MockFooter = vi.hoisted(() => vi.fn().mockReturnValue(null));
const MockNotFoundContent = vi.hoisted(() => vi.fn().mockReturnValue(null));
const MockQuickStart = vi.hoisted(() => vi.fn().mockReturnValue(null));

vi.mock("next/headers", () => ({ headers: mockHeaders, cookies: mockCookies }));
vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
	getMessages: mockGetMessages,
	setRequestLocale: mockSetRequestLocale,
}));
vi.mock("next-intl", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next-intl")>();
	return { ...actual, NextIntlClientProvider: ({ children }: { children: ReactNode }) => children };
});
vi.mock("@ui/modules/core/animate/providers/LazyMotionProvider", () => ({
	LazyMotionProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@ui/modules/providers/AppThemeProvider", () => ({
	AppThemeProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@ui/modules/shared/Header", () => ({ Header: MockHeader }));
vi.mock("@ui/modules/shared/footer/Footer", () => ({ Footer: MockFooter }));
vi.mock("@ui/modules/pages/not-found/NotFoundContent", () => ({ NotFoundContent: MockNotFoundContent }));
vi.mock("@ui/modules/pages/homepage/quick-start/QuickStart", () => ({ QuickStart: MockQuickStart }));
vi.mock("./fonts", () => ({
	DOCUMENT_BODY_CLASS: "bricolage-var space-grotesk-var instrument-serif-var jetbrains-mono-var font-sans antialiased",
}));
vi.mock("@styles/index.css", () => ({}));

const { default: GlobalNotFound, generateMetadata } = await import("./global-not-found");

interface TranslationsRequest {
	locale: Locale;
	namespace: "a11y" | "metadata";
}

interface Node {
	type?: unknown;
	props?: { children?: unknown; className?: unknown; locale?: unknown; messages?: unknown };
}

const nodesIn = (node: unknown): Node[] => {
	if (!node || typeof node !== "object") return [];
	const element = node as Node;
	return [element, ...[element.props?.children].flat().flatMap(nodesIn)];
};

interface OfTypeParams {
	tree: unknown;
	type: unknown;
}

const ofType = ({ tree, type }: OfTypeParams) => nodesIn(tree).filter((node) => node.type === type);

beforeEach(() => {
	vi.clearAllMocks();
	mockGetTranslations.mockImplementation(async ({ locale, namespace }: TranslationsRequest) =>
		createTranslator({ locale, messages: enMessages, namespace }),
	);
	mockGetMessages.mockResolvedValue(enMessages);
});

describe("global-not-found", () => {
	it("renders its own document, because no layout runs above it", async () => {
		const element = await GlobalNotFound();
		const [body] = ofType({ tree: element, type: "body" });

		expect(element.type).toBe("html");
		expect(String(body?.props?.className)).toContain("bricolage-var");
	});

	it("declares the default locale on <html lang> in the server HTML", async () => {
		expect((await GlobalNotFound()).props.lang).toBe(routing.defaultLocale);
	});

	it("pins the request locale to the default, so what the header and footer translate is the default language", async () => {
		await GlobalNotFound();

		expect(mockSetRequestLocale).toHaveBeenCalledExactlyOnceWith(routing.defaultLocale);
	});

	it("passes the default locale to every translation it asks for", async () => {
		await GlobalNotFound();

		expect(mockGetTranslations).toHaveBeenCalledExactlyOnceWith({ locale: routing.defaultLocale, namespace: "a11y" });
		expect(mockGetMessages).toHaveBeenCalledExactlyOnceWith({ locale: routing.defaultLocale });
	});

	it("asks the request nothing, so the page prerenders once and answers every URL no locale claims", async () => {
		await GlobalNotFound();

		expect(mockHeaders).not.toHaveBeenCalled();
		expect(mockCookies).not.toHaveBeenCalled();
	});

	it("hands the client provider the default locale and every namespace but the ones only the server reads", async () => {
		const [provider] = nodesIn(await GlobalNotFound()).filter((node) => node.props && "messages" in node.props);

		expect(provider?.props?.locale).toBe(routing.defaultLocale);
		expect(provider?.props?.messages).toEqual(clientMessagesOf(enMessages));
	});

	it("draws the 404 view between the header and the footer, with the quick start the header's trial action opens", async () => {
		const tree = await GlobalNotFound();
		const [shell] = nodesIn(tree).filter((node) =>
			[node.props?.children].flat().some((child) => (child as Node)?.type === MockHeader),
		);
		const order = [shell?.props?.children].flat().map((child) => (child as Node)?.type);

		expect(order).toEqual([MockHeader, MockNotFoundContent, MockFooter, MockQuickStart]);
		expect(ofType({ tree, type: MockNotFoundContent })[0]?.props?.locale).toBe(routing.defaultLocale);
		expect(ofType({ tree, type: MockQuickStart })[0]?.props?.locale).toBe(routing.defaultLocale);
	});

	it("titles the page with the default language's 404 title, from the messages", async () => {
		expect(await generateMetadata()).toEqual({ title: enMessages.metadata.notFound.title });
		expect(mockGetTranslations).toHaveBeenCalledExactlyOnceWith({
			locale: routing.defaultLocale,
			namespace: "metadata",
		});
	});
});
