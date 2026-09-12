import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logClient, logClientError } from "./clientLog";

const { mockLoggerModule, mockLogError } = vi.hoisted(() => ({
	mockLoggerModule: vi.fn(),
	mockLogError: vi.fn(),
}));

vi.mock("@infrastructure/logging/logger", () => ({
	get logger() {
		return mockLoggerModule();
	},
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe("a client log never makes its caller asynchronous", () => {
	it("returns undefined, not a promise the caller would have to await", () => {
		mockLoggerModule.mockReturnValue({ logError: mockLogError });
		expect(logClient(() => {})).toBeUndefined();
		expect(logClientError({ message: "boom", error: new Error("x") })).toBeUndefined();
	});

	it("has not written by the time it returns, so a test must wait for the import", async () => {
		mockLoggerModule.mockReturnValue({ logError: mockLogError });

		logClientError({ message: "boom", error: new Error("x"), context: { component: "Probe" } });
		expect(mockLogError).not.toHaveBeenCalled();

		await vi.waitFor(() => {
			expect(mockLogError).toHaveBeenCalledWith({
				message: "boom",
				error: expect.any(Error),
				context: { component: "Probe" },
			});
		});
	});
});

describe("a client log never fails its caller", () => {
	it("swallows a logger module that throws once the import resolves", async () => {
		mockLoggerModule.mockImplementation(() => {
			throw new Error("logger unavailable");
		});

		expect(() => logClientError({ message: "boom", error: new Error("x") })).not.toThrow();
		await vi.waitFor(() => {
			expect(mockLoggerModule).toHaveBeenCalled();
		});
	});

	it("swallows a write callback that throws", async () => {
		mockLoggerModule.mockReturnValue({ logError: mockLogError });

		expect(() =>
			logClient(() => {
				throw new Error("write failed");
			}),
		).not.toThrow();
		await vi.waitFor(() => {
			expect(mockLoggerModule).toHaveBeenCalled();
		});
	});
});

describe("the import that keeps the logger out of every client chunk", () => {
	const source = readFileSync(resolve(process.cwd(), "src/application/shared/utils/clientLog.ts"), "utf8");

	it("reaches the logger through a dynamic import", () => {
		expect(source).toMatch(/import\(["']@infrastructure\/logging\/logger["']\)/);
	});

	it("has no value-level static import of it", () => {
		expect(source).not.toMatch(/^import (?!type )[^\n]*logging\/logger/m);
	});
});
