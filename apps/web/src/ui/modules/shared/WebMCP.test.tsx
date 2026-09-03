import { LOCALES } from "@infrastructure/i18n/locales";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebMCP } from "./WebMCP";

type ModelContext = NonNullable<Navigator["modelContext"]>;
type Tool = Parameters<ModelContext["provideContext"]>[0]["tools"][number];

const provideContext = vi.fn<ModelContext["provideContext"]>();

const withModelContext = (value: ModelContext | undefined) => {
	Object.defineProperty(navigator, "modelContext", { value, configurable: true, writable: true });
};

const registeredTools = (): Tool[] => provideContext.mock.calls[0]?.[0].tools ?? [];

const toolNamed = (name: string) => {
	const tool = registeredTools().find((candidate) => candidate.name === name);
	if (!tool) throw new Error(`tool ${name} was not registered`);
	return tool;
};

beforeEach(() => {
	provideContext.mockClear();
	withModelContext({ provideContext });
});

afterEach(() => {
	withModelContext(undefined);
	vi.restoreAllMocks();
});

describe("WebMCP", () => {
	it("registers nothing, and throws nothing, in a browser without the model context API", () => {
		withModelContext(undefined);

		const { container } = render(<WebMCP />);

		expect(container.childNodes).toHaveLength(0);
		expect(provideContext).not.toHaveBeenCalled();
	});

	it("registers the two tools once, each with an empty object schema", () => {
		render(<WebMCP />);

		expect(provideContext).toHaveBeenCalledOnce();
		expect(registeredTools().map((tool) => tool.name)).toEqual(["get_site_info", "check_status"]);
		expect(registeredTools().every((tool) => tool.inputSchema.type === "object")).toBe(true);
	});

	it("describes the site with the locales the app ships and the origin it is running on", async () => {
		render(<WebMCP />);

		const info = (await toolNamed("get_site_info").execute({})) as {
			locales: readonly string[];
			strategies: string[];
			url: string;
		};

		expect(info.locales).toEqual(LOCALES);
		expect(info.strategies).toEqual(["grouped", "optimized", "balanced"]);
		expect(info.url).toBe(globalThis.location.origin);
	});

	it("answers a status check with the health endpoint's own body", async () => {
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(JSON.stringify({ status: "ok", timestamp: "now" })));
		render(<WebMCP />);

		const status = await toolNamed("check_status").execute({});

		expect(fetchSpy).toHaveBeenCalledExactlyOnceWith("/api/health");
		expect(status).toEqual({ status: "ok", timestamp: "now" });
	});
});
