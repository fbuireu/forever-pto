import { ValidationError } from "@infrastructure/errors";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { INVALID_BODY, parseJsonBody } from "./parseJsonBody";

function makeRequest(body: BodyInit | null): Request {
	return new Request("http://localhost/api/anything", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body,
	});
}

describe("parseJsonBody", () => {
	it("succeeds with the parsed object", async () => {
		const result = await Effect.runPromise(parseJsonBody(makeRequest(JSON.stringify({ email: "user@example.com" }))));
		expect(result).toEqual({ email: "user@example.com" });
	});

	it("fails with a ValidationError when the body is not valid JSON", async () => {
		const error = await Effect.runPromise(Effect.flip(parseJsonBody(makeRequest("{not json"))));
		expect(error).toBeInstanceOf(ValidationError);
		expect(error.message).toBe(INVALID_BODY);
	});

	it("fails with a ValidationError when the body is empty", async () => {
		const error = await Effect.runPromise(Effect.flip(parseJsonBody(makeRequest(null))));
		expect(error.message).toBe(INVALID_BODY);
	});

	it("fails with a ValidationError when the body is valid JSON but not an object", async () => {
		const error = await Effect.runPromise(Effect.flip(parseJsonBody(makeRequest("42"))));
		expect(error.message).toBe(INVALID_BODY);
	});

	it("fails with a ValidationError when the body is JSON null", async () => {
		const error = await Effect.runPromise(Effect.flip(parseJsonBody(makeRequest("null"))));
		expect(error.message).toBe(INVALID_BODY);
	});
});
