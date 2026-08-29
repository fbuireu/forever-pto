import { describe, expect, it } from "vitest";
import { BASE64_PATTERN, base64Decode, base64Encode, deobfuscate, obfuscate, TWENTY_FOUR_HOURS } from "./crypto";

describe("TWENTY_FOUR_HOURS", () => {
	it("equals 86400000 ms", () => {
		expect(TWENTY_FOUR_HOURS).toBe(86_400_000);
	});
});

describe("base64Encode / base64Decode", () => {
	it("round-trips ASCII text", () => {
		const text = "hello world";
		expect(base64Decode(base64Encode(text))).toBe(text);
	});

	it("round-trips unicode text", () => {
		const text = "café 日本語 🎉";
		expect(base64Decode(base64Encode(text))).toBe(text);
	});

	it("encodes to a non-empty base64 string", () => {
		expect(base64Encode("test")).toMatch(BASE64_PATTERN);
	});

	it("decodes a known base64 value", () => {
		expect(base64Decode("aGVsbG8=")).toBe("hello");
	});
});

describe("obfuscate / deobfuscate", () => {
	const key = "secret-key";

	it("obfuscate produces a different string than the input", () => {
		expect(obfuscate({ text: "plaintext", key })).not.toBe("plaintext");
	});

	it("round-trips ASCII text", () => {
		const text = "some payload";
		expect(deobfuscate({ text: obfuscate({ text, key }), key })).toBe(text);
	});

	it("round-trips unicode text", () => {
		const text = '{"value":"café","n":42}';
		expect(deobfuscate({ text: obfuscate({ text, key }), key })).toBe(text);
	});

	it("different keys produce different output", () => {
		const text = "hello";
		expect(obfuscate({ text, key: "key-a" })).not.toBe(obfuscate({ text, key: "key-b" }));
	});

	it("deobfuscate with wrong key does not reproduce original", () => {
		const obfuscated = obfuscate({ text: "hello", key: "correct" });
		expect(deobfuscate({ text: obfuscated, key: "wrong" })).not.toBe("hello");
	});
});
