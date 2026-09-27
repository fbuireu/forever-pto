export const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
export const BASE64_PATTERN = /^[A-Za-z0-9+/=]+$/;

export interface ObfuscationParams {
	text: string;
	key: string;
}

const CHUNK_SIZE = 8192;

const fromCodePoints = (points: ArrayLike<number>) => {
	let text = "";
	for (let start = 0; start < points.length; start += CHUNK_SIZE) {
		text += String.fromCodePoint(...Array.prototype.slice.call(points, start, start + CHUNK_SIZE));
	}
	return text;
};

export function base64Encode(str: string) {
	return btoa(fromCodePoints(new TextEncoder().encode(str)));
}

export function base64Decode(str: string) {
	const binaryString = atob(str);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.codePointAt(i) ?? 0;
	}
	return new TextDecoder().decode(bytes);
}

const xorWithKey = ({ text, key }: ObfuscationParams) => {
	const keyPoints = Array.from({ length: key.length }, (_, index) => key.codePointAt(index) ?? 0);
	const points = new Array<number>(text.length);
	for (let i = 0; i < text.length; i++) {
		points[i] = text.charCodeAt(i) ^ (keyPoints[i % keyPoints.length] ?? 0);
	}
	return fromCodePoints(points);
};

export function obfuscate({ text, key }: ObfuscationParams) {
	return base64Encode(xorWithKey({ text, key }));
}

export function deobfuscate({ text, key }: ObfuscationParams) {
	return xorWithKey({ text: base64Decode(text), key });
}
