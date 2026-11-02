import { describe, expect, it } from "vitest";
import {
	BASE64_PATTERN,
	base64Decode,
	base64Encode,
	deobfuscate,
	type ObfuscationParams,
	obfuscate,
	TWENTY_FOUR_HOURS,
} from "./crypto";

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

	const btoaEncode = (text: string): string =>
		btoa(Array.from(new TextEncoder().encode(text), (byte) => String.fromCodePoint(byte)).join(""));
	const atobDecode = (encoded: string): string =>
		new TextDecoder().decode(Uint8Array.from(atob(encoded), (char) => char.codePointAt(0) ?? 0));

	it.each([
		["plain ASCII", "hello world"],
		["accents and emoji", "café 日本語 🎉"],
		["the + and / of the standard alphabet, and its padding", "~~~???~"],
		["a payload longer than one chunk", JSON.stringify({ days: Array.from({ length: 3000 }, (_, i) => i) })],
		["an empty string", ""],
	])("writes and reads the padded standard alphabet btoa and atob did, for %s", (_, text) => {
		expect(base64Encode(text)).toBe(btoaEncode(text));
		expect(base64Decode(btoaEncode(text))).toBe(text);
		expect(atobDecode(base64Encode(text))).toBe(text);
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

	const referenceObfuscate = ({ text, key: secret }: ObfuscationParams) =>
		btoa(
			Array.from(
				new TextEncoder().encode(
					text
						.split("")
						.map((char, i) =>
							String.fromCodePoint((char.codePointAt(0) ?? 0) ^ (secret.codePointAt(i % secret.length) ?? 0)),
						)
						.join(""),
				),
				(byte) => String.fromCodePoint(byte),
			).join(""),
		);

	it.each([
		["plain ASCII", "some payload", key],
		["accents and emoji", '{"name":"café 🎉","n":42}', key],
		["a payload longer than one chunk", JSON.stringify({ days: Array.from({ length: 3000 }, (_, i) => i) }), key],
		["a key with an astral character", "hello world", "k🔑y"],
	])(
		"writes exactly what the previous implementation wrote, for %s, so stored blobs stay readable",
		(_, text, secret) => {
			expect(obfuscate({ text, key: secret })).toBe(referenceObfuscate({ text, key: secret }));
		},
	);

	it.each([
		["plain ASCII", "some payload"],
		["accents and emoji", '{"name":"café 🎉","n":42}'],
		["a payload longer than one chunk", JSON.stringify({ days: Array.from({ length: 3000 }, (_, i) => i) })],
	])("reads what the previous implementation wrote, for %s, so stored blobs still open", (_, text) => {
		expect(deobfuscate({ text: referenceObfuscate({ text, key }), key })).toBe(text);
	});

	it("opens a blob the btoa-based implementation stored", () => {
		const stored =
			"F00QFQ1ZFlZVCUMXF0gGDAwBJAYYThdRFw4UwohH8KaepElJWwkCAggAD0lWDhwAJwBVCggJAApNAgNAUVhNAhMCA0gZFxwIIgwPGEUAVlUpVEtTAVw4BEBNFQQeXhobAVBbVBg=";
		const persisted = {
			state: { premiumKey: "café 🎉", email: "ana@example.com", preferredMonths: [5, 6, 7] },
			version: 3,
		};

		expect(deobfuscate({ text: stored, key: "local-storage-key" })).toBe(JSON.stringify(persisted));
	});

	it("round-trips a payload longer than one chunk", () => {
		const text = JSON.stringify({ days: Array.from({ length: 3000 }, (_, i) => `2026-01-${i}`) });
		expect(deobfuscate({ text: obfuscate({ text, key }), key })).toBe(text);
	});
});
