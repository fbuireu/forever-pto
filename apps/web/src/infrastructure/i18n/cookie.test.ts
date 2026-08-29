import { describe, expect, it, vi } from "vitest";
import { LOCALE_COOKIE_POLICY, setLocaleCookie } from "./cookie";
import { ES, LOCALE_COOKIE } from "./locales";
import { routing } from "./routing";

function makeResponse() {
	const cookiesSet = vi.fn();
	return { response: { cookies: { set: cookiesSet } } as never, cookiesSet };
}

describe("the NEXT_LOCALE policy", () => {
	it("writes the whole policy and nothing besides the value", () => {
		const { response, cookiesSet } = makeResponse();

		setLocaleCookie({ response, value: ES });

		expect(cookiesSet).toHaveBeenCalledWith({
			name: LOCALE_COOKIE,
			value: ES,
			secure: true,
			sameSite: "lax",
			path: "/",
		});
	});

	it("hands next-intl the same attributes the middleware writes, so a soft locale switch round-trips", () => {
		const { response, cookiesSet } = makeResponse();

		setLocaleCookie({ response, value: ES });
		const [written] = cookiesSet.mock.calls[0] as [Record<string, unknown>];
		const { value, ...attributes } = written;

		expect(value).toBe(ES);
		expect(attributes).toEqual({ ...LOCALE_COOKIE_POLICY });
		expect(routing.localeCookie).toEqual(LOCALE_COOKIE_POLICY);
	});

	it("is not httpOnly, because a browser drops a document.cookie write to a name already httpOnly", () => {
		const { response, cookiesSet } = makeResponse();

		setLocaleCookie({ response, value: ES });

		expect(cookiesSet).toHaveBeenCalledWith(expect.not.objectContaining({ httpOnly: expect.anything() }));
		expect(routing.localeCookie).toEqual(expect.not.objectContaining({ httpOnly: expect.anything() }));
	});
});
