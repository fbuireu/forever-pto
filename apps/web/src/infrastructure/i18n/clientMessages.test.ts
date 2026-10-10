import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import en from "@i18n/messages/en.json";
import { describe, expect, it } from "vitest";
import { clientMessagesOf, isServerOnlyNamespace, SERVER_ONLY_NAMESPACES } from "./clientMessages";

const SRC = resolve(process.cwd(), "src");

const sourceFiles = (dir: string): string[] =>
	readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return sourceFiles(path);
		return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
	});

const FILES = sourceFiles(SRC).map((path) => ({
	path: relative(SRC, path).split(sep).join("/"),
	source: readFileSync(path, "utf8"),
}));
const rootOf = (key: string) => key.split(".")[0] ?? key;

const TRANSLATION_CALL = /useTranslations\(([^)]*)\)/g;
const NON_LITERAL_CALLERS = [
	"ui/modules/premium/featureLabels.ts",
	"ui/modules/pages/planner/holidays/components/HolidayFormModal.tsx",
	"ui/modules/pages/planner/holidays/components/AddHolidayModal.tsx",
	"ui/modules/pages/planner/holidays/components/EditHolidayModal.tsx",
];

describe("clientMessagesOf", () => {
	it("drops the namespaces only the server reads and keeps every other", () => {
		const client = clientMessagesOf(en);

		for (const namespace of Object.keys(en)) {
			expect(namespace in client).toBe(!isServerOnlyNamespace(namespace));
		}
	});

	it("names only namespaces the bundles have, so a rename cannot leave a stale entry behind", () => {
		for (const namespace of SERVER_ONLY_NAMESPACES) expect(Object.keys(en)).toContain(namespace);
	});
});

describe("no client code reads a namespace the client is not sent", () => {
	const calls = FILES.flatMap(({ path, source }) =>
		[...source.matchAll(TRANSLATION_CALL)].map(([, argument = ""]) => ({ path, argument: argument.trim() })),
	);

	it("reads every literal namespace from the ones the client receives", () => {
		const offenders = calls
			.filter(({ argument }) => /^["'`]/.test(argument))
			.filter(({ argument }) => isServerOnlyNamespace(rootOf(argument.slice(1, -1))))
			.map(({ path, argument }) => `${path} -> ${argument}`);

		expect(offenders).toEqual([]);
	});

	it("keeps a computed or missing namespace to the callers checked below", () => {
		const callers = [...new Set(calls.filter(({ argument }) => !/^["'`]/.test(argument)).map(({ path }) => path))];

		expect(callers.toSorted()).toEqual(NON_LITERAL_CALLERS.toSorted());
	});

	it("resolves every key those callers name from the namespaces the client receives", () => {
		const keys = FILES.filter(({ path }) => NON_LITERAL_CALLERS.includes(path)).flatMap(({ source }) =>
			[...source.matchAll(/"([a-z][A-Za-z]+)\.[A-Za-z.]+"/g)].map(([, root = ""]) => root),
		);

		expect(keys.length).toBeGreaterThan(0);
		expect(keys.filter((root) => isServerOnlyNamespace(root))).toEqual([]);
	});
});
