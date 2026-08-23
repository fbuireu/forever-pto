import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { describe, expect, it } from "vitest";
import { buildMetadata } from "./buildMetadata";

const NOINDEX_ROUTE = "/legal/legal-notice";
const PUBLIC_DIR = join(import.meta.dirname, "../../../public");
const TWITTER_LARGE_IMAGE_MIN_WIDTH = 300;

const BASE = {
	baseUrl: "https://forever-pto.com",
	locale: "en" as const,
	route: "/planner",
	title: "Planner",
	description: "Plan your days off",
};

const ogImage = (metadata: Metadata) => {
	const images = metadata.openGraph && "images" in metadata.openGraph ? metadata.openGraph.images : undefined;
	const [first] = Array.isArray(images) ? images : [images];

	if (!first || typeof first !== "object" || first instanceof URL) throw new Error("no Open Graph image descriptor");

	return first;
};

const readPngSize = (url: string) => {
	const png = readFileSync(join(PUBLIC_DIR, url));

	return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

describe("buildMetadata", () => {
	it("advertises an Open Graph image and a Twitter card on an indexable page with a description", () => {
		const metadata = buildMetadata(BASE);
		expect(metadata.openGraph?.images).toHaveLength(1);
		expect(metadata.twitter).toMatchObject({ card: "summary", title: "Planner" });
	});

	it("declares the dimensions the file on disk actually has, so swapping the asset cannot go unnoticed", () => {
		const image = ogImage(buildMetadata(BASE));
		const { width, height } = readPngSize(String(image.url));

		expect(Number(image.width)).toBe(width);
		expect(Number(image.height)).toBe(height);
	});

	it("claims only the card that file is large enough to carry", () => {
		const { width } = readPngSize(String(ogImage(buildMetadata(BASE)).url));

		expect(buildMetadata(BASE).twitter).toMatchObject({
			card: width >= TWITTER_LARGE_IMAGE_MIN_WIDTH ? "summary_large_image" : "summary",
		});
	});

	it("withholds both from a noindex page, so a legal notice advertises no card", () => {
		const metadata = buildMetadata({ ...BASE, route: NOINDEX_ROUTE });
		expect(metadata.openGraph?.images).toBeUndefined();
		expect(metadata.twitter).toBeUndefined();
	});

	it("reads indexability off the route table, so no caller can contradict it", () => {
		expect(buildMetadata({ ...BASE, route: NOINDEX_ROUTE, keywords: "pto" }).keywords).toBeUndefined();
		expect(buildMetadata({ ...BASE, route: "/not-in-the-table" }).robots).toEqual({ index: false, follow: false });
	});

	it("withholds the whole Open Graph block, and the card with it, when there is no description", () => {
		const metadata = buildMetadata({ ...BASE, description: undefined });
		expect(metadata.openGraph).toBeUndefined();
		expect(metadata.twitter).toBeUndefined();
		expect(metadata.description).toBeUndefined();
	});

	it("flips the robots block on indexable, googleBot directives included", () => {
		expect(buildMetadata(BASE).robots).toMatchObject({
			index: true,
			follow: true,
			googleBot: { index: true, follow: true, "max-image-preview": "large" },
		});
		expect(buildMetadata({ ...BASE, route: NOINDEX_ROUTE }).robots).toEqual({ index: false, follow: false });
	});

	it("canonicalises against the locale-prefixed path and lists every locale alternate", () => {
		const { alternates } = buildMetadata({ ...BASE, locale: "es" });
		expect(alternates?.canonical).toBe("/es/planner");
		expect(Object.keys(alternates?.languages ?? {}).length).toBeGreaterThan(1);
	});

	it("omits keywords rather than emitting an empty tag when none are given", () => {
		expect(buildMetadata(BASE).keywords).toBeUndefined();
		expect(buildMetadata({ ...BASE, keywords: "pto, holidays" }).keywords).toBe("pto, holidays");
	});
});
