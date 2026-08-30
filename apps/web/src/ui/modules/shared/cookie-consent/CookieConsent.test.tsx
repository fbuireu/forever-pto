import en from "@i18n/messages/en.json";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface DialogProps {
	open: boolean;
	analyticsEnabled: boolean;
	serviceStates: Record<string, boolean>;
	onAnalyticsChange: (checked: boolean) => void;
	onServiceChange: (serviceId: string, checked: boolean) => void;
	onAcceptAll: () => void;
	onRejectAll: () => void;
	onSave: () => void;
}

const lib = vi.hoisted(() => ({
	acceptService: vi.fn(),
	run: vi.fn(),
	getCookie: vi.fn(),
	acceptedService: vi.fn(),
	options: undefined as
		| {
				onConsent: () => void;
				onChange: (event: { changedCategories: string[] }) => void;
		  }
		| undefined,
}));

vi.mock("vanilla-cookieconsent", () => ({
	acceptService: lib.acceptService,
	acceptedService: lib.acceptedService,
	getCookie: lib.getCookie,
	run: (options: NonNullable<typeof lib.options>) => {
		lib.options = options;
		lib.run(options);
	},
}));

vi.mock("./CookieConsentDialog", () => ({
	CookieConsentDialog: (props: DialogProps) => (
		<div data-testid="dialog" data-open={String(props.open)} data-analytics={String(props.analyticsEnabled)}>
			<span data-testid="services">{JSON.stringify(props.serviceStates)}</span>
			<button type="button" onClick={() => props.onAnalyticsChange(true)}>
				enable analytics
			</button>
			<button type="button" onClick={() => props.onAnalyticsChange(false)}>
				disable analytics
			</button>
			<button type="button" onClick={() => props.onServiceChange("betterStack", true)}>
				enable betterStack
			</button>
			<button type="button" onClick={props.onSave}>
				save
			</button>
			<button type="button" onClick={props.onAcceptAll}>
				dialog accept all
			</button>
			<button type="button" onClick={props.onRejectAll}>
				dialog reject all
			</button>
		</div>
	),
}));

const { CookieConsent } = await import("./CookieConsent");

const gtag = vi.fn();

const renderConsent = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<CookieConsent />
		</NextIntlClientProvider>,
	);

const press = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

const dialog = () => screen.getByTestId("dialog");

const services = () => JSON.parse(screen.getByTestId("services").textContent ?? "{}") as Record<string, boolean>;

const acceptedServices = () => lib.acceptService.mock.calls.at(-1)?.[0] as string[];

const consentCalls = () => gtag.mock.calls.filter(([command]) => command === "consent");

const grantedByLastConsent = () =>
	(consentCalls().at(-1)?.[2] as { analytics_storage: string } | undefined)?.analytics_storage;

beforeEach(() => {
	lib.acceptService.mockClear();
	lib.run.mockClear();
	lib.options = undefined;
	lib.getCookie.mockReturnValue(undefined);
	lib.acceptedService.mockReturnValue(false);
	gtag.mockClear();
	vi.stubGlobal("gtag", gtag);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("the first visit", () => {
	it("shows the banner when nothing has been consented to yet", () => {
		renderConsent();

		expect(screen.getByRole("dialog", { name: en.cookies.title })).toBeTruthy();
	});

	it("shows the banner when the stored consent is empty rather than absent", () => {
		lib.getCookie.mockReturnValue({});

		renderConsent();

		expect(screen.getByRole("dialog", { name: en.cookies.title })).toBeTruthy();
	});

	it("does not show it to a returning visitor who has already answered", () => {
		lib.getCookie.mockReturnValue({ categories: ["analytics"] });

		renderConsent();

		expect(screen.queryByRole("dialog", { name: en.cookies.title })).toBeNull();
	});

	it("asks the library not to show its own banner, since this one replaces it", () => {
		renderConsent();

		expect(lib.run.mock.calls[0]?.[0]).toMatchObject({ autoShow: false });
	});
});

describe("accepting and refusing from the banner", () => {
	it("grants both services and reports a page view", () => {
		renderConsent();

		press(en.cookies.acceptAll);

		expect(acceptedServices()).toStrictEqual(["ga4", "betterStack"]);
		expect(grantedByLastConsent()).toBe("granted");
		expect(gtag.mock.calls).toContainEqual(["event", "page_view"]);
	});

	it("grants nothing and reports no page view when everything is refused", () => {
		renderConsent();

		press(en.cookies.rejectAll);

		expect(acceptedServices()).toStrictEqual([]);
		expect(grantedByLastConsent()).toBe("denied");
		expect(gtag.mock.calls).not.toContainEqual(["event", "page_view"]);
	});

	it("closes the banner once an answer is given", () => {
		renderConsent();

		press(en.cookies.acceptAll);

		expect(screen.queryByRole("dialog", { name: en.cookies.title })).toBeNull();
	});

	it("swaps the banner for the preferences dialog rather than showing both", () => {
		renderConsent();

		press(en.cookies.managePreferences);

		expect(screen.queryByRole("dialog", { name: en.cookies.title })).toBeNull();
		expect(dialog().dataset.open).toBe("true");
	});
});

describe("consent read per service", () => {
	it("denies analytics storage when only the service that is not Google is on", () => {
		renderConsent();
		press(en.cookies.managePreferences);

		press("enable betterStack");
		press("save");

		expect(acceptedServices()).toStrictEqual(["betterStack"]);
		expect(grantedByLastConsent()).toBe("denied");
		expect(gtag.mock.calls).not.toContainEqual(["event", "page_view"]);
	});

	it("reports the category as on while any one service is", () => {
		renderConsent();
		press(en.cookies.managePreferences);

		press("enable betterStack");

		expect(dialog().dataset.analytics).toBe("true");
	});

	it("turns every service on and off together from the category switch", () => {
		renderConsent();
		press(en.cookies.managePreferences);

		press("enable analytics");
		expect(services()).toStrictEqual({ ga4: true, betterStack: true });

		press("disable analytics");
		expect(services()).toStrictEqual({ ga4: false, betterStack: false });
	});

	it("seeds the switches from what the library already holds", () => {
		lib.getCookie.mockReturnValue({ categories: ["analytics"] });
		lib.acceptedService.mockImplementation((serviceId: string) => serviceId === "ga4");

		renderConsent();

		expect(services()).toStrictEqual({ ga4: true, betterStack: false });
	});
});

describe("the footer's manage-cookies button", () => {
	it("opens the dialog from an event dispatched on window", () => {
		lib.getCookie.mockReturnValue({ categories: [] });
		renderConsent();

		fireEvent(window, new Event("cc:showPreferences"));

		expect(dialog().dataset.open).toBe("true");
	});

	it("closes the first-visit banner rather than being short-circuited by it", () => {
		renderConsent();
		expect(screen.getByRole("dialog", { name: en.cookies.title })).toBeTruthy();

		fireEvent(window, new Event("cc:showPreferences"));

		expect(screen.queryByRole("dialog", { name: en.cookies.title })).toBeNull();
		expect(dialog().dataset.open).toBe("true");
	});

	it("stops listening once the component goes away", () => {
		const { unmount } = renderConsent();

		unmount();

		expect(() => fireEvent(window, new Event("cc:showPreferences"))).not.toThrow();
	});
});

describe("a change made outside this component", () => {
	it("re-reads the services when the library reports the analytics category changed", () => {
		lib.getCookie.mockReturnValue({ categories: [] });
		renderConsent();
		lib.acceptedService.mockReturnValue(true);

		act(() => lib.options?.onChange({ changedCategories: ["analytics"] }));

		expect(services()).toStrictEqual({ ga4: true, betterStack: true });
	});

	it("ignores a change to a category it does not own", () => {
		lib.getCookie.mockReturnValue({ categories: [] });
		renderConsent();
		lib.acceptedService.mockReturnValue(true);

		act(() => lib.options?.onChange({ changedCategories: ["necessary"] }));

		expect(services()).toStrictEqual({ ga4: false, betterStack: false });
	});

	it("re-reads the services when the library reports a consent", () => {
		lib.getCookie.mockReturnValue({ categories: [] });
		renderConsent();
		lib.acceptedService.mockReturnValue(true);

		act(() => lib.options?.onConsent());

		expect(services()).toStrictEqual({ ga4: true, betterStack: true });
	});
});

describe("a page with no analytics script on it", () => {
	it("saves the consent rather than throwing when gtag is absent", () => {
		vi.stubGlobal("gtag", undefined);
		renderConsent();

		expect(() => press(en.cookies.acceptAll)).not.toThrow();
		expect(acceptedServices()).toStrictEqual(["ga4", "betterStack"]);
	});
});
