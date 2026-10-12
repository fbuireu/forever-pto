import { DE, ES } from "@infrastructure/i18n/locales";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetLocale, MockNotFoundContent } = vi.hoisted(() => ({
	mockGetLocale: vi.fn(),
	MockNotFoundContent: vi.fn().mockReturnValue(null),
}));

vi.mock("next-intl/server", () => ({ getLocale: mockGetLocale }));
vi.mock("@ui/modules/pages/not-found/NotFoundContent", () => ({ NotFoundContent: MockNotFoundContent }));

const { default: NotFound } = await import("./not-found");

beforeEach(() => vi.clearAllMocks());

describe("(marketing)/not-found", () => {
	it("renders the 404 view in the request's locale", async () => {
		mockGetLocale.mockResolvedValueOnce(ES);
		const element = await NotFound();

		expect(element.type).toBe(MockNotFoundContent);
		expect(element.props.locale).toBe(ES);
	});

	it("follows the request when it changes, rather than holding a locale of its own", async () => {
		mockGetLocale.mockResolvedValueOnce(DE);

		expect((await NotFound()).props.locale).toBe(DE);
		expect(mockGetLocale).toHaveBeenCalledOnce();
	});
});
