import { beforeEach, describe, expect, it, vi } from "vitest";

const { NOT_FOUND, mockNotFound, mockNotFoundMetadata } = vi.hoisted(() => {
	const NOT_FOUND = "NEXT_HTTP_ERROR_FALLBACK;404";

	return {
		NOT_FOUND,
		mockNotFound: vi.fn(() => {
			throw new Error(NOT_FOUND);
		}),
		mockNotFoundMetadata: vi.fn(),
	};
});

vi.mock("next/navigation", () => ({ notFound: mockNotFound }));
vi.mock("@infrastructure/seo/notFoundMetadata", () => ({ notFoundMetadata: mockNotFoundMetadata }));

const { default: UnknownPage, generateMetadata } = await import("./page");

beforeEach(() => vi.clearAllMocks());

describe("[...rest]/page", () => {
	it("answers every path under a locale that no page claims with notFound, so the group's 404 renders in the shell", () => {
		expect(() => UnknownPage()).toThrow(NOT_FOUND);
		expect(mockNotFound).toHaveBeenCalledExactlyOnceWith();
	});

	it("titles the 404 through notFoundMetadata, which the page's notFound does not stop", () => {
		expect(generateMetadata).toBe(mockNotFoundMetadata);
	});
});
