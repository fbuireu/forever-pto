import en from "@i18n/messages/en.json";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { version } from "../../../../../package.json";

const { logClientError } = vi.hoisted(() => ({ logClientError: vi.fn() }));

vi.mock("@application/shared/utils/clientLog", () => ({ logClientError }));

vi.mock("next/dynamic", () => ({
	default:
		() =>
		({ open }: { open: boolean }) => <div data-testid="contact-modal" data-open={String(open)} />,
}));

const { ErrorContent } = await import("./ErrorContent");

const LINE_COUNT = 40;
const LINE_DELAY_MS = 130;

const boom = (message = "palm tree overflow") => {
	const error = new Error(message) as Error & { digest?: string };
	error.digest = "digest-1234";
	error.stack = "Error: palm tree overflow\n    at handler (api/bridges.ts:31:9)";
	return error;
};

const renderError = (error = boom(), reset = vi.fn()) => {
	const view = render(
		<NextIntlClientProvider locale="en" messages={en}>
			<ErrorContent error={error} reset={reset} />
		</NextIntlClientProvider>,
	);
	return { ...view, reset };
};

const revealEverything = () => {
	for (let line = 0; line < LINE_COUNT; line++) {
		act(() => {
			vi.advanceTimersByTime(LINE_DELAY_MS);
		});
	}
};

const terminal = () => document.querySelector("pre") as HTMLElement;

beforeEach(() => {
	logClientError.mockClear();
	vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
	vi.useRealTimers();
});

describe("what the error page reports back", () => {
	it("logs the error it caught, with the digest that identifies the server render", () => {
		renderError();

		expect(logClientError).toHaveBeenCalledExactlyOnceWith({
			message: "Unhandled error caught by error boundary",
			error: expect.any(Error),
			context: { component: "ErrorPage", digest: "digest-1234" },
		});
	});

	it("names the running version, so a report says which build broke", () => {
		renderError();

		expect(document.body.textContent).toContain(`v${version}`);
	});
});

describe("the terminal the page types out", () => {
	it("shows nothing at first, then a line at a time", () => {
		renderError();
		expect(terminal().children).toHaveLength(0);

		act(() => {
			vi.advanceTimersByTime(LINE_DELAY_MS);
		});
		expect(terminal().children).toHaveLength(1);

		act(() => {
			vi.advanceTimersByTime(LINE_DELAY_MS);
		});
		expect(terminal().children).toHaveLength(2);
	});

	it("stops once every line is out rather than counting past the end", () => {
		renderError();

		revealEverything();
		const settled = terminal().children.length;

		revealEverything();

		expect(terminal().children).toHaveLength(settled);
	});

	it("prints the error's own message, which is the only line about this failure", () => {
		renderError();

		revealEverything();

		expect(terminal().textContent).toContain("palm tree overflow");
	});

	it("falls back to a generic message when the error carries none", () => {
		renderError(Object.assign(new Error(""), { digest: undefined }));

		revealEverything();

		expect(terminal().textContent).toContain(en.error.internalServerError);
	});

	it("prints the stack when there is one", () => {
		renderError();

		revealEverything();

		expect(terminal().textContent).toContain("at handler (api/bridges.ts:31:9)");
	});

	it("colours the level of a log line, which is the only thing separating a warning from a failure", () => {
		renderError();

		revealEverything();
		const levels = [...terminal().querySelectorAll("span[style]")].map((span) => span.textContent?.trim());

		expect(levels).toContain("WARN");
		expect(levels).toContain("ERROR");
		expect(levels).toContain("OK");
	});

	it("ends on a prompt with a blinking cursor rather than on a stack frame", () => {
		renderError();

		revealEverything();

		expect(terminal().textContent).toContain("fixing-it-now");
		expect(terminal().textContent).not.toContain("fixing-it-now _");
	});
});

describe("what the reader can do about it", () => {
	it("re-renders the tree that threw", () => {
		const { reset } = renderError();

		fireEvent.click(screen.getByRole("button", { name: en.error.retry }));

		expect(reset).toHaveBeenCalledOnce();
	});

	it("keeps the contact form shut until it is asked for", () => {
		renderError();

		expect(screen.getByTestId("contact-modal").dataset.open).toBe("false");

		fireEvent.click(screen.getByRole("button", { name: new RegExp(en.error.contact) }));

		expect(screen.getByTestId("contact-modal").dataset.open).toBe("true");
	});

	it("sends the reader somewhere that is still up, in a tab of its own", () => {
		renderError();

		const status = screen.getByRole("link", { name: new RegExp(en.error.statusPage) });

		expect(status.getAttribute("href")).toBe("https://status.forever-pto.com");
		expect(status.getAttribute("rel")).toBe("noopener noreferrer");
		expect(status.getAttribute("target")).toBe("_blank");
	});
});
