import { describe, expect, it, vi } from "vitest";

const { mockGetCloudflareContext } = vi.hoisted(() => ({ mockGetCloudflareContext: vi.fn() }));

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: mockGetCloudflareContext }));

const { traced } = await import("./span");

describe("traced", () => {
	it("opens a named span through the runtime and returns what the work resolved to", async () => {
		const enterSpan = vi.fn((_name: string, run: () => Promise<unknown>) => run());
		mockGetCloudflareContext.mockReturnValue({ ctx: { tracing: { enterSpan } } });

		await expect(traced({ name: "createPayment", run: async () => "charged" })).resolves.toBe("charged");
		expect(enterSpan).toHaveBeenCalledWith("createPayment", expect.any(Function));
	});

	it("runs the work once when there is no Cloudflare context, rather than twice", async () => {
		mockGetCloudflareContext.mockImplementation(() => {
			throw new Error("no context");
		});
		const run = vi.fn().mockResolvedValue("ok");

		await expect(traced({ name: "createPayment", run })).resolves.toBe("ok");
		expect(run).toHaveBeenCalledTimes(1);
	});

	it("runs the work once when the context carries no tracing api", async () => {
		mockGetCloudflareContext.mockReturnValue({ ctx: {} });
		const run = vi.fn().mockResolvedValue("ok");

		await expect(traced({ name: "createPayment", run })).resolves.toBe("ok");
		expect(run).toHaveBeenCalledTimes(1);
	});

	it("lets a rejection through untouched instead of retrying it", async () => {
		mockGetCloudflareContext.mockImplementation(() => {
			throw new Error("no context");
		});
		const failure = new Error("declined");
		const run = vi.fn().mockRejectedValue(failure);

		await expect(traced({ name: "createPayment", run })).rejects.toBe(failure);
		expect(run).toHaveBeenCalledTimes(1);
	});
});
