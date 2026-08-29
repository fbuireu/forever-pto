import { SessionError } from "@infrastructure/errors";
import { describe, expect, it } from "vitest";
import {
	isSessionConfigurationError,
	MissingJWTSecret,
	SessionConfigurationError,
	wrapSessionError,
} from "./sessionErrors";

describe("wrapSessionError", () => {
	it("reports a missing JWT secret as a configuration failure", () => {
		const error = wrapSessionError(new MissingJWTSecret("JWT_SECRET environment variable is not set"));

		expect(isSessionConfigurationError(error)).toBe(true);
		expect(error.message).toBe("JWT_SECRET environment variable is not set");
	});

	it("reports anything else as an ordinary session failure", () => {
		const error = wrapSessionError(new Error("signature verification failed"));

		expect(isSessionConfigurationError(error)).toBe(false);
		expect(error.message).toBe("signature verification failed");
	});

	it("stringifies a non-Error rejection", () => {
		const error = wrapSessionError("token expired");

		expect(error.message).toBe("token expired");
		expect(isSessionConfigurationError(error)).toBe(false);
	});

	it("keeps the cause on both shapes", () => {
		const missing = new MissingJWTSecret("gone");
		const other = new Error("nope");

		expect(wrapSessionError(missing).cause).toBe(missing);
		expect(wrapSessionError(other).cause).toBe(other);
	});
});

describe("SessionConfigurationError", () => {
	it("keeps the SessionError tag, so every caller's error channel is unchanged", () => {
		expect(wrapSessionError(new MissingJWTSecret("gone"))._tag).toBe("SessionError");
	});

	it("does not narrow a plain SessionError", () => {
		expect(isSessionConfigurationError(new SessionError({ message: "expired" }))).toBe(false);
	});

	it("narrows an instance built directly", () => {
		expect(isSessionConfigurationError(new SessionConfigurationError({ message: "gone" }))).toBe(true);
	});
});
