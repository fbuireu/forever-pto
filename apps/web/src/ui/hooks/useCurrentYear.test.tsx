import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCurrentYear } from "./useCurrentYear";

const SERVER_YEAR = 2026;
const VISITOR_YEAR = 2031;

const YearProbe = () => <>{useCurrentYear(SERVER_YEAR)}</>;

afterEach(() => {
	vi.useRealTimers();
});

describe("useCurrentYear", () => {
	it("answers the year the server rendered with on the server, whatever the clock says", () => {
		vi.useFakeTimers({ now: new Date(VISITOR_YEAR, 0, 1), toFake: ["Date"] });

		expect(renderToString(<YearProbe />)).toBe(String(SERVER_YEAR));
	});

	it("answers the server's year on the first client pass and the visitor's once mounted", () => {
		vi.useFakeTimers({ now: new Date(VISITOR_YEAR, 0, 1), toFake: ["Date"] });
		const answers: number[] = [];

		renderHook(() => {
			const year = useCurrentYear(SERVER_YEAR);
			answers.push(year);
			return year;
		});

		expect(answers).toStrictEqual([SERVER_YEAR, VISITOR_YEAR]);
	});

	it("keeps the server's year when the visitor's clock agrees with it", () => {
		vi.useFakeTimers({ now: new Date(SERVER_YEAR, 11, 31), toFake: ["Date"] });

		const { result } = renderHook(() => useCurrentYear(SERVER_YEAR));

		expect(result.current).toBe(SERVER_YEAR);
	});
});
