import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import ts from "@typescript/typescript6";
import { describe, expect, it } from "vitest";
import webNextConfig, { PUBLIC_ENV, RUNTIME_ONLY } from "../apps/web/next.config";
import { PAYMENT_SUCCEEDED } from "../apps/web/src/domain/payment/events/types";

const ROOT = resolve(__dirname, "..");
const WEB = "apps/web";
const DOCS = "apps/docs";
const WORKSPACE_PACKAGES = [WEB, DOCS];
const PACKAGE_GUIDES = WORKSPACE_PACKAGES.map((pkg) => `${pkg}/CLAUDE.md`);
const LAYER_ROOTS = ["app", "application", "domain", "infrastructure", "ui"].map((layer) => `${WEB}/src/${layer}`);
const LOCALES_DIR = `${WEB}/src/ui/i18n/messages`;
const ADR_DIR = "adr";
const ADR_TEMPLATE = "0000-adr-template.md";
// Written by `pnpm cf:typegen` into the web package, so it is absent from the tracked tree by design.
const GENERATED_ENV_TYPES = "cloudflare-env.d.ts";
const HAND_WRITTEN_ENV_TYPES = "environment.d.ts";
const UNDECLARED_NAME = 2304;
const GENERATED_MARKDOWN = new Set([`${WEB}/CHANGELOG.md`]);

// `pnpm <word>` occurrences in a guide that are not package scripts.
const NON_SCRIPT_PNPM = new Set(["install", "lint-staged", "commitlint", "vitest", "dlx", "exec"]);

const SOURCE_FILE = /\.(ts|tsx)$/;
const CODE_SHAPED_SUFFIX = /\.(ts|tsx|json|md)$/;
const GLOSSARY_TERM = /^\*\*(.+?)\*\*:[ \t]*\n(.*)$/gm;
const GLOSSARY_AVOID_LINE = /^_Avoid_:(.*)$/gm;
const GLOSSARY_TERM_WITH_AVOID = /^\*\*(.+?)\*\*:[ \t]*\n((?:.+\n)*?)_Avoid_:(.*)$/gm;
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;
const ADR_FILENAME = /^\d{4}-[a-z0-9-]+\.md$/;
const ADR_NUMBERED_HEADING = /^# (\d+)\. \S/;
const ADR_DATE_LINE = /^Date: \d{4}-\d{2}-\d{2}$/;
const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const BACKTICKED_TOKEN = /`([^`]+)`/g;
const BACKTICKED_SOURCE_FILE = /`([^`\s]+\.(?:ts|tsx))`/g;
const NESTED_CONTEXT_CITATION = /((?:[\w@-]+\/)+CONTEXT\.md)/g;
const AMENDMENT_WORD = /amend\w*/gi;
const ADR_REFERENCE = /adr\/(\d{4})-[a-z0-9-]+\.md|\bADR (\d{4})\b/g;
const AMENDMENT_PROXIMITY = 200;
const TABLE_ROW = /^\s*\|(.*)\|\s*$/;
const TABLE_SEPARATOR_ROW = /^[\s|:-]+$/;
const PACKAGE_IN_CELL = new RegExp(String.raw`\x60(${WORKSPACE_PACKAGES.join("|")})\x60`);
const BACKTICKED_ALIAS = /`([^`.]+\/\*)`/g;
// `pnpm` spells the package flag four ways and the two rules reading citations knew one of them, so
// `pnpm -F forever-pto-docs bulid` was invisible to both: the bare pattern met a `-` where it wanted
// `[a-z]` and yielded nothing at all, and the filtered pattern wanted the literal `--filter`. One parser
// reads every invocation now, so a flag spelling cannot switch a rule off. `--dir` and `-C` name a
// directory where `--filter` and `-F` name a package, which is why both forms of ref have to resolve.
const PNPM_PACKAGE_FLAG = "(?:--filter|-F|--dir|-C)";
const PNPM_INVOCATION = new RegExp(
	String.raw`\bpnpm((?:\s+${PNPM_PACKAGE_FLAG}(?:\s+|=)\S+|\s+-{1,2}[\w-]+)*)\s+(?:run\s+)?([a-z][a-z0-9:-]*)`,
	"g",
);
const PNPM_INVOCATION_START = /\bpnpm\s+\S/g;
const CITED_PACKAGE_REF = new RegExp(String.raw`${PNPM_PACKAGE_FLAG}(?:\s+|=)(\S+)`);
const WORKFLOW_SHELL_STEP = /^(\s*)-?[ \t]*(?:run|command):[ \t]*(\|[-+]?)?[ \t]*(.*)$/;
// The two censuses below count steps, and both were counting a spelling rather than a job. `BUILD_COMMAND`
// read `pnpm … build` and nothing else, so `pnpm -F <pkg> build`, `pnpm exec astro build` and `npx next
// build` were all invisible; the deploy census substring-matched `wrangler deploy`, which is two of this
// repo's four deploys. The other two arrive through `cloudflare/wrangler-action`'s `command:` input and
// through a script name (`apps/docs`'s `deploy` is `astro build && wrangler deploy`). A tool name is what
// survives a change of runner, so that is what these match, plus the script names that resolve to one.
const BUILD_TOOL_COMMAND = /\b(?:astro|next|opennextjs-cloudflare|vite|tsc|turbo) build\b/;
const BUILD_SCRIPT_NAME = /^(?:cf:)?build$/;
const DEPLOY_TOOL_COMMAND = /\b(?:wrangler|opennextjs-cloudflare) deploy\b/;
const SECRET_TOOL_COMMAND = /\bwrangler secret\b/;
const WRANGLER_ACTION_DEPLOY = /\bcommand:[ \t]*deploy\b/;
const ALIAS_WILDCARD_SUFFIX = /\/\*$/;
const WORKSPACE_PACKAGE_GLOB = /^\s*-\s*['"]?([^'"\s#]+)['"]?\s*$/gm;
const GITHUB_WORKFLOW_EXPRESSION = /\$\{\{\s*github\.workflow\s*\}\}/;
const FONT_VARIABLE = /variable: ["'](--[\w-]+)["']/g;

const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A compound noun does not always pluralise on its last word. `term + "s?"` matched "day offs", which
// nobody writes, and could not match "days off", which the wiki wrote seven times across four pages while
// this rule reported nothing. Every word takes the optional `s` now, and the gaps take any run of
// whitespace, so a compound broken across a wrapped line is still read as one term.
const retiredTermPattern = (term: string) =>
	new RegExp(
		`\\b${term
			.split(/\s+/)
			.map((word) => `${escapeForRegExp(word)}s?`)
			.join("\\s+")}\\b`,
		"gi",
	);

// Everything the repo would ship, staged or not, so a rule fires before the offending file is committed.
// Ignored paths and vendored tooling under dotfolders are excluded: they are not ours to fix.
// The index can lie (a stash cycle leaves deleted paths cached), so every entry is confirmed on disk.
const trackedFiles = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
	cwd: ROOT,
	encoding: "utf8",
})
	.split("\n")
	.filter((path) => path.length > 0 && !path.startsWith(".") && existsSync(join(ROOT, path)));

const markdownFiles = trackedFiles.filter((path) => path.endsWith(".md"));
const contentFiles = trackedFiles.filter((path) => path.endsWith(".mdx"));
const authoredMarkdown = markdownFiles.filter((path) => !GENERATED_MARKDOWN.has(path));
const sourceFiles = trackedFiles.filter((path) => SOURCE_FILE.test(path));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const PUBLIC_ENV_NAME = /\bNEXT_PUBLIC_[A-Z0-9_]+/g;

interface StepBodyParams {
	workflow: string;
	name: string;
}

const stepBody = ({ workflow, name }: StepBodyParams): string => {
	const lines = workflow.split(/\r?\n/);
	const start = lines.findIndex((line) => line.trimStart().startsWith(`- name: ${name}`));
	if (start < 0) return "";

	const rest = lines.slice(start + 1);
	const end = rest.findIndex((line) => /^\s*- name: /.test(line));

	return (end < 0 ? rest : rest.slice(0, end)).join("\n");
};
const readIfPresent = (path: string) => (existsSync(join(ROOT, path)) ? read(path) : "");
const readJson = (path: string) => JSON.parse(read(path));

// A relative specifier is not its file name. TypeScript resolves `"./foo"` to `foo.ts` *or* `foo/index.ts`,
// and NodeNext writes `"./foo.js"` for what is authored as `foo.ts`. Every candidate has to be a source file
// on disk: `existsSync` alone says yes to the directory a barrel specifier names, which is not a module.
interface ResolveRelativeImportParams {
	from: string;
	specifier: string;
}

const resolveRelativeImport = ({ from, specifier }: ResolveRelativeImportParams) => {
	const target = join(dirname(from), specifier).replace(/\\/g, "/");
	const candidates = SOURCE_FILE.test(target)
		? [target]
		: [
				...(target.endsWith(".js") ? [target.replace(/\.js$/, ".ts"), target.replace(/\.js$/, ".tsx")] : []),
				`${target}.ts`,
				`${target}.tsx`,
				`${target}/index.ts`,
				`${target}/index.tsx`,
			];

	return (
		candidates.find((candidate) => {
			const absolute = join(ROOT, candidate);
			return existsSync(absolute) && statSync(absolute).isFile();
		}) ?? null
	);
};

const isGitIgnored = (path: string) => {
	try {
		execFileSync("git", ["check-ignore", "--no-index", "-q", "--", path], { cwd: ROOT });
		return true;
	} catch {
		return false;
	}
};

const rootGuide = read("CLAUDE.md");
const webGuide = readIfPresent(`${WEB}/CLAUDE.md`);
const rootManifest = readJson("package.json");
const rootScripts: Record<string, string> = rootManifest.scripts ?? {};
const webScripts: Record<string, string> = readJson(`${WEB}/package.json`).scripts ?? {};
const docsScripts: Record<string, string> = readJson(`${DOCS}/package.json`).scripts ?? {};
// Keyed by every ref a citation can name a package with: its manifest name for `--filter` and `-F`, and
// its directory, bare or dot-prefixed, for `--dir` and `-C`.
const scriptsByPackageRef = new Map(
	WORKSPACE_PACKAGES.flatMap((pkg) => {
		const manifest = readJson(`${pkg}/package.json`);
		const scripts = (manifest.scripts ?? {}) as Record<string, string>;
		return [manifest.name as string, pkg, `./${pkg}`].map((ref) => [ref, scripts] as [string, Record<string, string>]);
	}),
);

interface PnpmCitation {
	pkg: string | null;
	script: string;
}

const pnpmCitations = (body: string): PnpmCitation[] =>
	[...body.matchAll(PNPM_INVOCATION)]
		.map(([, flags = "", script = ""]) => ({ pkg: CITED_PACKAGE_REF.exec(flags)?.[1] ?? null, script }))
		.filter(({ script }) => !NON_SCRIPT_PNPM.has(script));

// A workflow step naming a script runs everything the chain ends in, and the chains here are three deep:
// root `deploy` is `pnpm --filter forever-pto-web deploy`, which is `pnpm run cf:build && opennextjs-cloudflare
// deploy`. A census that reads the step text alone sees the script name and none of that. An unfiltered
// citation inside a package's own script resolves against that package, which is why the ref is inherited.
interface ExpandScriptParams {
	citation: PnpmCitation;
	seen?: Set<string>;
}

const expandScript = ({ citation, seen = new Set<string>() }: ExpandScriptParams): string => {
	const key = `${citation.pkg ?? "<root>"}:${citation.script}`;
	if (seen.has(key)) return "";
	seen.add(key);

	const scripts = citation.pkg === null ? rootScripts : (scriptsByPackageRef.get(citation.pkg) ?? {});
	const body = scripts[citation.script] ?? "";

	return [
		body,
		...pnpmCitations(body).map((next) =>
			expandScript({ citation: { pkg: next.pkg ?? citation.pkg, script: next.script }, seen }),
		),
	].join("\n");
};
const webTsconfig = readJson(`${WEB}/tsconfig.json`);
const webTsconfigOptions: Record<string, unknown> = webTsconfig.compilerOptions;
const webTsconfigExclude: string[] = webTsconfig.exclude ?? [];
const webTsconfigPaths: Record<string, string[]> = webTsconfigOptions.paths as Record<string, string[]>;

// The cross-package seam had three declarations of one string (the vite alias, `astro check`'s paths entry
// and two hardcoded copies down in this file), and nothing compared them. `apps/docs/tsconfig.json` is the
// declaration now; `astro.config.ts` derives the vite alias from it, and every rule below resolves through
// this one map rather than spelling `apps/web/src/ui` again.
const UI_ALIAS = "@ui/*";
const docsTsconfigPaths: Record<string, string[] | undefined> =
	readJson(`${DOCS}/tsconfig.json`).compilerOptions?.paths ?? {};
const UI_ROOT = join(ROOT, DOCS, (docsTsconfigPaths[UI_ALIAS]?.[0] ?? "").replace(ALIAS_WILDCARD_SUFFIX, ""));
const UI_ROOT_RELATIVE = relative(ROOT, UI_ROOT).replace(/\\/g, "/");
const resolveUiSpecifier = (specifier: string) => join(UI_ROOT, specifier.replace("@ui/", ""));

// A workflow is not markdown, so nothing above reaches it, and `.github/` sits under a dotfolder, which
// `trackedFiles` drops wholesale. The commands are read out of it by hand: the value when it is inline, and
// every line indented under it when it is a block scalar. `command:` counts as well as `run:`: no deploy,
// build or secret write is wrapped in `nick-fields/retry` any more, but the two preview-Worker deletes still
// are, and that action takes its shell script on `command:`, so a rule reading only `run:` would miss them.
const WORKFLOW_DIR = ".github/workflows";
const COMPOSITE_ACTION_DIR = ".github/actions";
const REPINNED_RUNTIME = /^\s*(?:node-version|version):\s*["']?\d/m;
const VERSIONS_SECTION = /^## Versions$([\s\S]*?)^## /m;
const QUOTED_VERSION = /\d+\.\d+/;
const workflowFiles = readdirSync(join(ROOT, WORKFLOW_DIR))
	.filter((file) => file.endsWith(".yml"))
	.map((file) => `${WORKFLOW_DIR}/${file}`);

// `_deploy-web.yml` is the one workflow written with CRLF, and `$` in a non-multiline pattern will not match
// past the carriage return, so splitting on "\n" alone left every line of it unmatched and the rule silently
// checking nothing there.
const runCommands = (workflow: string) => {
	const lines = workflow.split(/\r?\n/);
	const collected: string[] = [];

	lines.forEach((line, index) => {
		const match = WORKFLOW_SHELL_STEP.exec(line);
		if (!match) return;
		const [, indent = "", block, inline = ""] = match;
		if (!block) {
			collected.push(inline);
			return;
		}
		for (const body of lines.slice(index + 1)) {
			if (body.trim().length > 0 && !body.startsWith(`${indent} `)) break;
			collected.push(body);
		}
	});

	return collected.join("\n");
};

interface YamlBlockParams {
	workflow: string;
	key: string;
}

// `yamlBlock` finds the *first* line whose trim equals the key, which is the workflow-level block when there
// is one. Once a key is declared per job there is more than one, and reading the first would compare one job
// against every claim. This narrows to a job's own body first: from `  <job>:` to the next line at that same
// indent.
interface JobBodyParams {
	workflow: string;
	job: string;
}

const jobBody = ({ workflow, job }: JobBodyParams) => {
	const lines = workflow.split(/\r?\n/);
	const start = lines.findIndex((line) => line === `  ${job}:`);
	if (start < 0) return "";
	const end = lines.slice(start + 1).findIndex((line) => /^ {2}[\w-]+:/.test(line));

	return lines.slice(start + 1, end < 0 ? lines.length : start + 1 + end).join("\n");
};

const yamlBlock = ({ workflow, key }: YamlBlockParams) => {
	const lines = workflow.split(/\r?\n/);
	const start = lines.findIndex((line) => line.trim() === `${key}:`);
	const body: Record<string, string> = {};
	if (start < 0) return body;

	for (const line of lines.slice(start + 1)) {
		if (line.trim().length === 0 || !/^\s/.test(line)) break;
		const entry = /^\s+([\w-]+):\s*(.+)$/.exec(line);
		if (entry) body[entry[1] as string] = (entry[2] as string).trim();
	}

	return body;
};

interface TomlSection {
	path: string;
	entries: Record<string, string>;
}

const tomlSections = (source: string) => {
	const sections: TomlSection[] = [];
	let current: TomlSection | undefined;

	for (const raw of source.split(/\r?\n/)) {
		const line = raw.trim();
		const header = /^\[\[?([^\]]+)\]\]?$/.exec(line);
		if (header) {
			current = { path: header[1] as string, entries: {} };
			sections.push(current);
			continue;
		}
		const entry = /^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/.exec(line);
		if (entry && current) current.entries[entry[1] as string] = (entry[2] as string).trim();
	}

	return sections;
};

const webWrangler = tomlSections(read(`${WEB}/wrangler.toml`));
const WRANGLER_ENVIRONMENTS = ["", "env.development", "env.production"];
const NAMED_WRANGLER_ENVIRONMENTS = WRANGLER_ENVIRONMENTS.filter((environment) => environment !== "");
const WRANGLER_NAMED_BINDING_TABLES = [
	"ratelimits",
	"r2_buckets",
	"kv_namespaces",
	"d1_databases",
	"durable_objects",
	"queues",
	"tail_consumers",
	"services",
	"hyperdrive",
	"vectorize",
	"analytics_engine_datasets",
	"mtls_certificates",
	"send_email",
	"workflows",
	"pipelines",
];
const WRANGLER_BINDING_TABLES = ["vars", ...WRANGLER_NAMED_BINDING_TABLES];
interface WranglerSectionParams {
	environment: string;
	table: string;
}

const wranglerSection = ({ environment, table }: WranglerSectionParams) =>
	webWrangler.filter((section) => section.path === (environment ? `${environment}.${table}` : table));
const wranglerBindingTables = (environment: string) =>
	new Set(WRANGLER_BINDING_TABLES.filter((table) => wranglerSection({ environment, table }).length > 0));
const wranglerBindings = (environment: string) => {
	const [vars] = wranglerSection({ environment, table: "vars" });
	const named = WRANGLER_NAMED_BINDING_TABLES.flatMap((table) => wranglerSection({ environment, table }))
		.flatMap((section) => [section.entries.binding, section.entries.name, section.entries.service])
		.filter((value): value is string => Boolean(value))
		.map((value) => value.replace(/^["']|["']$/g, ""));

	return new Set([...Object.keys(vars?.entries ?? {}), ...named]);
};

interface HeaderRule {
	source: string;
	headers: { key: string; value: string }[];
}

const webHeaderRules = ((await webNextConfig.headers?.()) ?? []) as HeaderRule[];

const cloudflareEnvBindings = [
	...(/interface CloudflareEnv \{([\s\S]*?)\n\t\}/.exec(read(`${WEB}/environment.d.ts`))?.[1] ?? "").matchAll(
		/^\t\t(\w+)\??:/gm,
	),
].map(([, name]) => name as string);

describe("CONTEXT.md is the domain glossary and nothing else", () => {
	const glossary = read("CONTEXT.md");

	it("lives only at the repo root", () => {
		expect(markdownFiles.filter((path) => path.endsWith("/CONTEXT.md"))).toEqual([]);
	});

	it("is linked from CLAUDE.md so it is discoverable", () => {
		expect(rootGuide).toContain("CONTEXT.md");
	});

	it("carries no file paths, identifiers or call signatures", () => {
		const codeShaped = [...glossary.matchAll(BACKTICKED_TOKEN)]
			.map((match) => match[1])
			.filter((token) => token.includes("/") || token.includes("(") || CODE_SHAPED_SUFFIX.test(token));
		expect(codeShaped).toEqual([]);
	});

	it("gives every term a definition", () => {
		const terms = [...glossary.matchAll(GLOSSARY_TERM)];
		expect(terms.length).toBeGreaterThan(0);
		const undefined_ = terms.filter(([, , definition]) => {
			const text = definition.trim();
			return text.length === 0 || text.startsWith("_Avoid_:");
		});
		expect(undefined_.map(([, term]) => term)).toEqual([]);
	});

	// A glossary is the ubiquitous language only while the rest of the tree speaks it. A term nothing outside
	// this file uses is either a concept that was renamed and left a headstone, or one that was never real:
	// either way the next reader is told a word is canonical when nothing canonical uses it. Prose is the
	// scope, because that is where a term appears as a term; the same word inside an identifier is checked by
	// the retired-name rules instead. Compound terms pluralise on every word, for the reason the header of
	// this file records: `Carry-over Month` has to match `Carry-over Months`.
	it("uses every term it defines somewhere outside itself", () => {
		const elsewhere = authoredMarkdown
			.filter((path) => path !== "CONTEXT.md")
			.concat(contentFiles)
			.map((path) => read(path))
			.join("\n");

		const defined = [...glossary.matchAll(GLOSSARY_TERM)].map(([, term]) => term);
		const unused = defined.filter((term) => !retiredTermPattern(term).test(elsewhere));

		expect(defined.length).toBeGreaterThan(20);
		expect(unused).toEqual([]);
	});

	it("never leaves an _Avoid_ list empty", () => {
		const empty = [...glossary.matchAll(GLOSSARY_AVOID_LINE)].filter(([, list]) => list.trim().length === 0);
		expect(empty).toEqual([]);
	});

	it("never lists a term as its own alternative", () => {
		const selfAvoiding: string[] = [];
		for (const [, term, , avoided] of glossary.matchAll(GLOSSARY_TERM_WITH_AVOID)) {
			const alternatives = avoided.split(",").map((entry) => entry.trim().toLowerCase());
			if (alternatives.includes(term.toLowerCase())) selfAvoiding.push(term);
		}
		expect(selfAvoiding).toEqual([]);
	});
});

describe("the workspace is shaped the way the guides describe it", () => {
	const workspaceGlobs = [...read("pnpm-workspace.yaml").matchAll(WORKSPACE_PACKAGE_GLOB)].map(([, glob]) => glob);

	it("declares package globs that match a directory holding a manifest", () => {
		const dangling = workspaceGlobs.filter((glob) => {
			const [base] = glob.split("/*");
			return !existsSync(join(ROOT, base ?? "")) || !statSync(join(ROOT, base ?? "")).isDirectory();
		});
		expect(dangling).toEqual([]);
	});

	it.each(WORKSPACE_PACKAGES)("%s is a workspace member with its own manifest", (pkg) => {
		expect(existsSync(join(ROOT, pkg, "package.json"))).toBe(true);
		expect(workspaceGlobs.some((glob) => pkg.startsWith(glob.replace(/\*$/, "")))).toBe(true);
	});

	it.each(WORKSPACE_PACKAGES)("%s explains itself to a human and to an agent", (pkg) => {
		expect(existsSync(join(ROOT, pkg, "README.md"))).toBe(true);
		expect(existsSync(join(ROOT, pkg, "CLAUDE.md"))).toBe(true);
		expect(read("README.md")).toContain(`(${pkg}/README.md)`);
	});

	it("keeps the root private, unversioned and dependency-free", () => {
		expect(rootManifest.private).toBe(true);
		expect(rootManifest.version).toBe("0.0.0");
		expect(rootManifest.dependencies).toBeUndefined();
	});

	it.each(WORKSPACE_PACKAGES)("%s carries no biome config and no lockfile of its own", (pkg) => {
		expect(existsSync(join(ROOT, pkg, "biome.json"))).toBe(false);
		expect(existsSync(join(ROOT, pkg, "pnpm-lock.yaml"))).toBe(false);
	});

	it("resolves every repo-relative path biome's includes list excludes", () => {
		const includes: string[] = readJson("biome.json").files.includes;
		const dangling = includes
			.filter((entry) => entry.startsWith("!") && !entry.includes("*"))
			.map((entry) => entry.slice(1))
			.filter((path) => !existsSync(join(ROOT, path)));
		expect(dangling).toEqual([]);
	});

	it("classifies every public variable the app declares, and no other", () => {
		const declared = [...new Set([...read(`${WEB}/environment.d.ts`).matchAll(PUBLIC_ENV_NAME)].map(([name]) => name))];
		const classified = Object.keys(PUBLIC_ENV);

		expect(declared.filter((name) => !classified.includes(name)).sort()).toEqual([]);
		expect(classified.filter((name) => !declared.includes(name)).sort()).toEqual([]);
		expect(declared.length).toBeGreaterThan(0);
	});

	it("wires every public variable where its kind says it is read", () => {
		const deployWorkflow = read(`${WORKFLOW_DIR}/_deploy-web.yml`);
		const buildStep = stepBody({ workflow: deployWorkflow, name: "Build" });
		const wrangler = read(`${WEB}/wrangler.toml`);
		const unwired = Object.entries(PUBLIC_ENV).flatMap(([name, schema]) => {
			const runtimeOnly = schema === RUNTIME_ONLY;
			const wired = runtimeOnly ? wrangler.includes(name) : buildStep.includes(name);

			return wired ? [] : [`${name} (${runtimeOnly ? "runtime" : "inlined"})`];
		});

		expect(unwired.sort()).toEqual([]);
		expect(buildStep).not.toBe("");
	});

	it("pairs every patched dependency with a Renovate rule a human merges", () => {
		const patched = [...read("pnpm-workspace.yaml").matchAll(/^ {2}"?([^\s:"]+)"?: (patches\/\S+)$/gm)].map(
			([, name, file]) => ({ name: name.replace(/@[\d.]+$/, ""), file }),
		);
		const humanMerged = readJson(".github/renovate.json")
			.packageRules.filter((rule: { automerge?: boolean }) => rule.automerge === false)
			.flatMap((rule: { matchDepNames?: string[] }) => rule.matchDepNames ?? []);

		expect(patched.map(({ file }) => file).filter((file) => !existsSync(join(ROOT, file)))).toEqual([]);
		expect(readdirSync(join(ROOT, "patches")).length).toBe(patched.length);
		expect(patched.map(({ name }) => name).filter((name) => !humanMerged.includes(name))).toEqual([]);
		expect(patched.length).toBeGreaterThan(0);
	});

	it("keeps the web tsconfig beside the next config it is rewritten by", () => {
		expect(existsSync(join(ROOT, WEB, "next.config.ts"))).toBe(true);
		expect(existsSync(join(ROOT, WEB, "tsconfig.json"))).toBe(true);
	});

	it("pins typescript exactly everywhere, moves the root with the app, and holds the docs on 6", () => {
		const declared = ["package.json", ...WORKSPACE_PACKAGES.map((pkg) => `${pkg}/package.json`)]
			.map((file) => [file, readJson(file).devDependencies?.typescript] as const)
			.filter(([, version]) => Boolean(version));

		expect(declared.length).toBe(3);
		expect(declared.filter(([, version]) => !EXACT_VERSION.test(version))).toEqual([]);

		const pinned = Object.fromEntries(declared);
		expect(pinned["package.json"]).toBe(pinned[`${WEB}/package.json`]);
		expect(pinned[`${DOCS}/package.json`].startsWith("6.")).toBe(true);
	});
});

// A pinned version is the one fact in a guide that a bot rewrites on its own, and both ways of writing it
// down have failed in this family of repositories. contribKit asserted the digit in prose against the
// manifest, so every Renovate bump failed on `CLAUDE.md does not state Flutter 3.47.2`: a documentation edit
// the bot cannot make, punishing the bump instead of the drift. The guides that dropped the assertion and
// kept the digit rotted instead, this one included. So the Versions section names the file each runtime is
// pinned in and never what the pin says, and nothing here reads a digit out of prose. What is asserted is
// the shape a bump cannot change, which is the same thing the typescript rule above already does.
describe("pinned runtimes", () => {
	const manifest = readJson("package.json");
	const [packageManagerName, packageManagerVersion] = manifest.packageManager.split("@");

	it("names every runtime it pins", () => {
		const named = ["Node", "pnpm"].flatMap((runtime) =>
			["CLAUDE.md", "CONTRIBUTING.md"].filter((doc) => !read(doc).includes(runtime)).map((doc) => `${doc}: ${runtime}`),
		);

		expect(named).toEqual([]);
	});

	// The rules around this one hold the pins to each other and none of them reads the section the digits
	// were removed from, so a bullet could quote a version again and everything would still pass. Only the
	// line that opens a bullet is checked: the prose beneath narrates the versions this guide used to state
	// wrongly, and that history is the reason the decision exists.
	it("quotes a version for none of them, since nothing here would keep one current", () => {
		const section = read("CLAUDE.md").match(VERSIONS_SECTION)?.[1] ?? "";
		const quoting = section.split("\n").filter((line) => line.startsWith("- ") && QUOTED_VERSION.test(line));

		expect(section).not.toBe("");
		expect(quoting).toEqual([]);
	});

	it("pins Node once: .nvmrc and engines.node are one fact, so they say the same thing", () => {
		expect(read(".nvmrc").trim()).toBe(manifest.engines.node);
	});

	it("pins pnpm once, through packageManager", () => {
		expect(packageManagerName).toBe("pnpm");
		expect(WORKSPACE_PACKAGES.filter((pkg) => readJson(`${pkg}/package.json`).packageManager)).toEqual([]);
	});

	it("pins every runtime to an exact version, never a range", () => {
		expect(manifest.engines.node).toMatch(EXACT_VERSION);
		expect(packageManagerVersion).toMatch(EXACT_VERSION);
	});

	it("lets no workflow or composite action pin a runtime the manifest already pins", () => {
		const composites = readdirSync(join(ROOT, COMPOSITE_ACTION_DIR)).map(
			(action) => `${COMPOSITE_ACTION_DIR}/${action}/action.yml`,
		);
		const candidates = [...workflowFiles, ...composites];
		const repinned = candidates.filter((file) => REPINNED_RUNTIME.test(read(file)));

		expect(candidates.length).toBeGreaterThan(workflowFiles.length);
		expect(repinned).toEqual([]);
	});
});

describe("the security header policy covers every request", () => {
	const REQUIRED_HEADERS = [
		"Content-Security-Policy",
		"Strict-Transport-Security",
		"X-Content-Type-Options",
		"X-Frame-Options",
		"X-XSS-Protection",
		"Referrer-Policy",
		"Permissions-Policy",
		"Cross-Origin-Opener-Policy",
		"Cross-Origin-Resource-Policy",
	];
	const REQUIRED_CSP_DIRECTIVES = ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'"];
	const HSTS_MINIMUM_MAX_AGE = 31536000;
	const FRAMING_REFUSALS = ["DENY", "SAMEORIGIN"];
	const sent = new Map(webHeaderRules.flatMap(({ headers }) => headers.map(({ key, value }) => [key, value])));

	it("matches every path, from exactly one rule", () => {
		expect(webHeaderRules.map(({ source }) => source)).toEqual(["/(.*)"]);
	});

	it("sends every header a browser cannot be told about later", () => {
		expect(REQUIRED_HEADERS.filter((header) => !sent.get(header))).toEqual([]);
	});

	it("states the three CSP directives whose absence is invisible in a browser", () => {
		const directives = (sent.get("Content-Security-Policy") ?? "").split(";").map((directive) => directive.trim());
		expect(REQUIRED_CSP_DIRECTIVES.filter((directive) => !directives.includes(directive))).toEqual([]);
	});

	it("holds a browser to HTTPS for a year, subdomains included", () => {
		const hsts = sent.get("Strict-Transport-Security") ?? "";
		expect(Number(/max-age=(\d+)/.exec(hsts)?.[1] ?? 0)).toBeGreaterThanOrEqual(HSTS_MINIMUM_MAX_AGE);
		expect(hsts).toContain("includeSubDomains");
	});

	it("refuses framing and content sniffing outright", () => {
		expect(FRAMING_REFUSALS).toContain(sent.get("X-Frame-Options"));
		expect(sent.get("X-Content-Type-Options")).toBe("nosniff");
	});

	// `next/font/google` downloads and self-hosts at build time, so no runtime request reaches a Google font
	// host. The two allowances that named them were dead, and a dead allowance reads as evidence that the app
	// fetches fonts cross-origin, which is the opposite of what it does.
	it("allows no font CDN, because next/font/google self-hosts at build time", () => {
		expect(read(`${WEB}/src/app/fonts.ts`)).toContain('from "next/font/google"');
		expect(sent.get("Content-Security-Policy") ?? "").not.toMatch(/fonts\.(?:googleapis|gstatic)\.com/);
	});
});

describe("every wrangler environment carries the whole binding set", () => {
	it("reads a binding surface out of the web package at all", () => {
		expect(cloudflareEnvBindings.length).toBeGreaterThan(2);
		expect(webWrangler.length).toBeGreaterThan(5);
		expect(wranglerBindingTables("").size).toBeGreaterThan(2);
	});

	it.each(WRANGLER_ENVIRONMENTS.map((environment) => [environment || "the top level", environment] as const))(
		"binds every CloudflareEnv name in %s",
		(_label, environment) => {
			const bound = wranglerBindings(environment);
			expect(cloudflareEnvBindings.filter((name) => !bound.has(name))).toEqual([]);
		},
	);

	it.each(NAMED_WRANGLER_ENVIRONMENTS)("declares every binding kind the top level declares in %s", (environment) => {
		const declared = wranglerBindingTables(environment);
		expect([...wranglerBindingTables("")].filter((table) => !declared.has(table))).toEqual([]);
	});

	// The guide teaches which blocks may be deleted as duplication, and it used `[observability]` as its
	// example of the safe-to-inherit kind while the file restated it in both named environments. `[assets]`
	// and `[placement]` are the blocks that really are written once. A reader trusting the old sentence would
	// delete the wrong one, and observability is the setting whose absence hides every other symptom.
	it.each(["assets", "placement"])("declares [%s] once, at the top level, and lets inheritance carry it", (table) => {
		expect(wranglerSection({ environment: "", table }).length).toBe(1);
		const restated = NAMED_WRANGLER_ENVIRONMENTS.filter(
			(environment) => wranglerSection({ environment, table }).length > 0,
		);
		expect(restated).toEqual([]);
	});

	it("restates the same observability settings in every environment that restates them at all", () => {
		const tables = ["observability", "observability.logs", "observability.traces"];
		const blocks = WRANGLER_ENVIRONMENTS.map((environment) =>
			tables.map((table) => wranglerSection({ environment, table }).map((section) => section.entries)),
		);

		expect(blocks[0]?.flat().length).toBe(tables.length);
		expect(new Set(blocks.map((block) => JSON.stringify(block))).size).toBe(1);
	});

	it("gives the payment rate limiter identical bounds in every environment", () => {
		const limiters = WRANGLER_ENVIRONMENTS.map((environment) =>
			wranglerSection({ environment, table: "ratelimits" }).find(
				(section) => section.entries.name === '"PAYMENT_RATE_LIMITER"',
			),
		);

		expect(limiters.filter((limiter) => !limiter)).toEqual([]);
		expect(new Set(limiters.map((limiter) => JSON.stringify(limiter?.entries))).size).toBe(1);
	});
});

describe("folder guides exist where they are promised", () => {
	const nestedGuides = markdownFiles.filter((path) => path !== "CLAUDE.md" && path.endsWith("CLAUDE.md"));
	const webSrcGuides = nestedGuides.filter((path) => path.startsWith(`${WEB}/src/`));

	it.each(LAYER_ROOTS)("%s has a CLAUDE.md", (layer) => {
		expect(existsSync(join(ROOT, layer, "CLAUDE.md"))).toBe(true);
	});

	it.each(PACKAGE_GUIDES)("%s exists", (guide) => {
		expect(existsSync(join(ROOT, guide))).toBe(true);
	});

	// The reverse direction of the link check, in two levels: a guide no index points at will not be read.
	it("lists every package guide in the root CLAUDE.md", () => {
		expect(PACKAGE_GUIDES.filter((guide) => !rootGuide.includes(`./${guide}`))).toEqual([]);
	});

	it("lists every web source guide in the apps/web CLAUDE.md table", () => {
		expect(webSrcGuides.length).toBeGreaterThan(LAYER_ROOTS.length);
		const missing = webSrcGuides.filter((path) => !webGuide.includes(`./${path.slice(`${WEB}/`.length)}`));
		expect(missing).toEqual([]);
	});

	// The heading is the guide's only self-identification; a wrong one sends a reader to another folder.
	it("titles every nested guide with its own folder path, then a body", () => {
		const malformed = nestedGuides.filter((path) => {
			const [heading, , body] = read(path).split("\n");
			return heading !== `# ${dirname(path)}` || !body?.trim();
		});
		expect(malformed).toEqual([]);
	});
});

describe("architecture decision records", () => {
	const adrs = readdirSync(join(ROOT, ADR_DIR)).filter((file) => file.endsWith(".md"));
	const decisions = adrs.filter((file) => file !== ADR_TEMPLATE);

	it("ships the template the contract tells you to copy", () => {
		expect(adrs).toContain(ADR_TEMPLATE);
	});

	it("are all named NNNN-slug.md", () => {
		expect(adrs.filter((file) => !ADR_FILENAME.test(file))).toEqual([]);
	});

	it("are numbered contiguously from 0001", () => {
		const numbers = decisions.map((file) => Number(file.slice(0, 4))).sort((a, b) => a - b);
		expect(numbers).toEqual(numbers.map((_, index) => index + 1));
	});

	it("carry every section of the template", () => {
		const incomplete: string[] = [];
		for (const file of adrs) {
			const body = read(`${ADR_DIR}/${file}`);
			const missing = ["## Status", "## Context", "## Decision", "## Consequences"].filter(
				(section) => !body.includes(`\n${section}\n`),
			);
			if (missing.length > 0) incomplete.push(`${file} -> ${missing.join(", ")}`);
		}
		expect(incomplete).toEqual([]);
	});

	it("open with a numbered title matching the filename, then a date", () => {
		const malformed: string[] = [];
		for (const file of adrs) {
			const [heading = "", blank, date = ""] = read(`${ADR_DIR}/${file}`).split("\n");
			const numbered = ADR_NUMBERED_HEADING.exec(heading);
			if (!numbered || Number(numbered[1]) !== Number(file.slice(0, 4))) {
				malformed.push(`${file} -> heading: ${heading}`);
				continue;
			}
			if (blank !== "" || !ADR_DATE_LINE.test(date)) malformed.push(`${file} -> date: ${date}`);
		}
		expect(malformed).toEqual([]);
	});

	// An ADR only its own folder points at will not be read.
	it("are each linked from a document outside adr/", () => {
		const elsewhere = authoredMarkdown.filter((path) => !path.startsWith(`${ADR_DIR}/`)).map(read);
		const orphaned = decisions.filter((file) => !elsewhere.some((body) => body.includes(file)));
		expect(orphaned).toEqual([]);
	});

	// Twice in one audit a nested guide recorded a change and the ADR it amends did not, and both guides
	// named the ADR they were amending. The maintenance contract's "amend it, or supersede it and say so"
	// row is the rule that slipped, and it slipped the worse way round: the guide was right and the ADR was
	// wrong, while the ADR is what every future agent is told not to re-litigate. `domain/calendar/CLAUDE.md`
	// said outright "That is an amendment to ADR 0006" and then answered, in the opposite direction, a
	// question ADR 0006 was still asking a reader to settle with a probe on a deployed preview.
	//
	// The detectable half is the round trip: a document that ties the word "amend" to an ADR has to be named
	// back by that ADR. Naming it is what makes the amendment reachable from the file people are pointed at,
	// and it is also what forces the author to open the ADR, which is where the stale sentence is.
	//
	// Proximity rather than grammar, because "an amendment to ADR 0006", "the 2026-08-14 amendment to ADR
	// 0006" and "ADR 0006, amended" all have to count and no phrasing rule separates a claim from a
	// citation. Both readings want the same round trip anyway.
	it("name back every document outside adr/ that ties an amendment to them", () => {
		const byNumber = new Map(decisions.map((file) => [file.slice(0, 4), read(`${ADR_DIR}/${file}`)]));
		const unrecorded: string[] = [];

		for (const file of authoredMarkdown.filter((path) => !path.startsWith(`${ADR_DIR}/`))) {
			const body = read(file);
			for (const claim of body.matchAll(AMENDMENT_WORD)) {
				const at = claim.index ?? 0;
				const window = body.slice(Math.max(0, at - AMENDMENT_PROXIMITY), at + AMENDMENT_PROXIMITY);
				for (const [, fromLink, fromProse] of window.matchAll(ADR_REFERENCE)) {
					const number = fromLink ?? fromProse;
					const adr = number ? byNumber.get(number) : undefined;
					if (!adr || adr.includes(file)) continue;
					unrecorded.push(`${file} amends ADR ${number}, which never names ${file}`);
				}
			}
		}

		expect([...new Set(unrecorded)]).toEqual([]);
	});
});

describe("documentation does not point at things that are gone", () => {
	const IGNORED_LINK = /^(https?:|mailto:|#|webcal:)/;

	it("resolves every relative markdown link", () => {
		const broken: string[] = [];
		for (const file of authoredMarkdown) {
			for (const [, , target] of read(file).matchAll(MARKDOWN_LINK)) {
				if (IGNORED_LINK.test(target)) continue;
				const [path] = target.split("#");
				if (!path) continue;
				if (!existsSync(resolve(ROOT, dirname(file), path))) broken.push(`${file} -> ${target}`);
			}
		}
		expect(broken).toEqual([]);
	});

	// A resolver cannot tell a right link from a wrong one that happens to resolve. ADR 0011's release table
	// wrote the app's row as `[`package.json`](../package.json)`, which from `adr/` is the **root** manifest:
	// the one that same ADR insists stays private at `0.0.0` with no dependencies, and the one semantic-release
	// does not write. The cell beside it said `../apps/web/CHANGELOG.md` correctly, which is exactly what makes
	// the wrong one easy to read past, and the relative-link rule above passed it happily because the file is
	// there.
	//
	// The mechanical form of the mistake is a row that names one package and then points outside it at a file
	// that package has its own copy of. `.github/workflows/docs.yml` in a row about `apps/docs` is fine and has
	// to stay fine: there is no `apps/docs/docs.yml`, so the link cannot have meant a different file. A root
	// `package.json` in a row about `apps/web` is not, because `apps/web/package.json` exists and is what the
	// row is about.
	it("keeps a table row that names a package from linking the root twin of that package's own file", () => {
		const mistargeted: string[] = [];

		for (const file of authoredMarkdown) {
			for (const line of read(file).split(/\r?\n/)) {
				const row = TABLE_ROW.exec(line);
				if (!row?.[1] || TABLE_SEPARATOR_ROW.test(row[1])) continue;

				const named = PACKAGE_IN_CELL.exec(row[1])?.[1];
				if (!named) continue;

				for (const [, , target] of line.matchAll(MARKDOWN_LINK)) {
					if (!target || IGNORED_LINK.test(target)) continue;
					const [path] = target.split("#");
					if (!path) continue;

					const resolved = relative(ROOT, resolve(ROOT, dirname(file), path)).replace(/\\/g, "/");
					if (resolved === named || resolved.startsWith(`${named}/`)) continue;
					if (!existsSync(join(ROOT, named, basename(resolved)))) continue;

					mistargeted.push(`${file} -> row about ${named} links ${target}, but ${named}/${basename(resolved)} exists`);
				}
			}
		}

		expect(mistargeted).toEqual([]);
	});

	// Absent from the tracked tree by design, yet the guides have to name it.
	const GENERATED = new Set([GENERATED_ENV_TYPES]);

	// Absent because a decision put it there. ADR 0009 records why the per-request chain is at `middleware.ts`
	// and not at `proxy.ts`, which is a statement about a file that does not exist and cannot be written
	// without naming it. Everything else in this rule stays as strict as it was: a name lands here only when
	// the absence is the point, never to quiet a citation that has merely rotted.
	const DELIBERATELY_ABSENT = new Set(["proxy.ts"]);

	const exists = (token: string) => sourceFiles.some((path) => path === token || path.endsWith(`/${token}`));
	const citedSourceFiles = (files: string[]) => {
		const missing: string[] = [];
		for (const file of files) {
			for (const [, token] of read(file).matchAll(BACKTICKED_SOURCE_FILE)) {
				if (token.includes("*") || token.startsWith(".") || GENERATED.has(token) || DELIBERATELY_ABSENT.has(token))
					continue;
				if (!exists(token)) missing.push(`${file} -> ${token}`);
			}
		}
		return missing;
	};

	it("names only source files that still exist somewhere", () => {
		expect(citedSourceFiles(authoredMarkdown)).toEqual([]);
	});

	it("names only source files that still exist, in the published wiki too", () => {
		expect(contentFiles.length).toBeGreaterThan(50);
		expect(citedSourceFiles(contentFiles)).toEqual([]);
	});

	// A guide may write `src/…` because it sits inside the package it describes, and the rules above
	// match a citation by suffix so both forms resolve. The wiki has no such context: `workers/tail`
	// is a different directory from `src/infrastructure/workers`, and `src/` alone names neither
	// package. Every repo path it prints has to carry its own prefix.
	// The root guide forbids a nested CONTEXT.md outright: the name would mean two things, and the
	// domain-modeling skill reads it as vocabulary. The wiki taught the opposite under a heading of
	// "CONTEXT.md per folder" and cited five paths that have never existed. A relative-link rule cannot
	// catch it, because these are prose citations rather than links.
	it("never teaches a nested CONTEXT.md, which the root guide forbids", () => {
		const offenders: string[] = [];
		for (const file of [...authoredMarkdown, ...contentFiles]) {
			for (const [, token] of read(file).matchAll(NESTED_CONTEXT_CITATION)) {
				offenders.push(`${file} -> ${token}`);
			}
		}
		expect(offenders).toEqual([]);
	});

	// The wiki forked from the app and kept teaching behaviour the app had already fixed, and the worst of it
	// was named in backticks: `MARKDOWN_CACHE_CONTROL` existed in exactly two places in the whole repo, both
	// of them wiki lines claiming the middleware set a cache policy it does not set; `DISALLOWED_PAGES` and
	// `RATE_LIMIT_KV` named a prefix list and a KV namespace that had both been replaced. Nothing could catch
	// them: `astro check` registers no MDX plugin, the source-file rules match paths, and the `tsx`-fence rule
	// only reaches an identifier that is imported in a fence. A constant is the shape that rots invisibly,
	// because prose keeps reading correctly around it.
	//
	// The bar is existence, not export: `MIN_FINAL_AMOUNT` is module-private and `NEXT_LOCALE` is a cookie's
	// value rather than its identifier, and the wiki is right to name both. What it may not do is invent one.
	//
	// Prose only, and the title says so. A fenced block is the app's own code quoted verbatim, where a
	// constant is either real or a compile error in the file it came from; the fence-stripping above is the
	// point rather than an oversight, so the title had to stop promising the whole page.
	it("names only constants that exist somewhere in apps/web, in the published wiki's prose", () => {
		const SCREAMING_SNAKE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;
		const CONSTANT_NAME = /[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+/g;

		// A binding, a var and a workflow secret are all spelled like a constant and declared outside the
		// sources, so the corpus is the package plus the workflows rather than `src/` alone.
		const CONFIGURATION = [
			`${WEB}/environment.d.ts`,
			`${WEB}/wrangler.toml`,
			`${WEB}/.env.example`,
			`${WEB}/playwright.config.ts`,
			`${WEB}/workers/tail/wrangler.toml`,
			...workflowFiles,
		];
		const corpus = [
			...sourceFiles.filter((path) => path.startsWith(`${WEB}/`)),
			...CONFIGURATION.filter((path) => existsSync(join(ROOT, path))),
		];

		const declared = new Set<string>();
		for (const file of corpus) {
			for (const name of read(file).match(CONSTANT_NAME) ?? []) declared.add(name);
		}

		const offenders: string[] = [];
		let checked = 0;

		for (const file of contentFiles) {
			// A fenced block opens with three backticks, and `BACKTICKED_TOKEN` pairs them one at a time: the
			// fence body becomes a token and the two backticks left over pair with the next one in prose, so
			// every span after the first fence on a page is off by one. Nothing downstream of a fence was being
			// read, which is how a reinstated `MARKDOWN_CACHE_CONTROL` first went unnoticed here.
			const prose = read(file).replace(/```[\s\S]*?```/g, "");
			for (const [, token] of prose.matchAll(BACKTICKED_TOKEN)) {
				if (!SCREAMING_SNAKE.test(token)) continue;
				checked += 1;
				if (!declared.has(token)) offenders.push(`${file} -> ${token}`);
			}
		}

		expect(corpus.length).toBeGreaterThan(100);
		expect(checked).toBeGreaterThan(50);
		expect(offenders).toEqual([]);
	});

	// `astro check` does not resolve a `@ui/…` specifier that points at nothing: moving Switch from
	// animate/primitives/base/ to animate/base/ left SwitchDemo importing the old path, `astro check`
	// reported zero errors, and only `astro build` failed, in the Docs workflow, after the app's own CI
	// had gone green. The guides claim the `astro check` tail covers this seam; for a missing module it
	// does not, and this is the cheaper place to catch it than a build is.
	it("resolves every @ui specifier the docs sources import to a file that exists", () => {
		const UI_SPECIFIER = /from\s*['"](@ui\/[^'"]+)['"]/g;
		const dangling: string[] = [];

		for (const file of trackedFiles.filter((path) => path.startsWith(`${DOCS}/src/`))) {
			for (const [, specifier] of read(file).matchAll(UI_SPECIFIER)) {
				const base = resolveUiSpecifier(specifier);
				const resolved = [`${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`, base].some(
					(candidate) => existsSync(candidate),
				);
				if (!resolved) dangling.push(`${file} -> ${specifier}`);
			}
		}

		expect(dangling).toEqual([]);
	});

	// The same seam, one file type over, and nothing resolved it at all: `astro check` does not read CSS, and
	// the docs workflow's trigger list proves only that a change under `apps/web/src/ui/` rebuilds this site,
	// not that what `global.css` reaches for still exists. A renamed `@import` target fails `astro build`
	// loudly but late, in the Docs workflow, after the app's own CI has gone green. A renamed `@source` target
	// does not fail at all: Tailwind extracts no class from a path matching nothing, the build stays green and
	// the demos ship unstyled, which `demos.spec.ts` cannot see because it asserts a 200, a child count and a
	// silent console. Bare package specifiers are the resolver's problem, so only the relative reaches count.
	it("resolves every relative @import and @source the docs stylesheets reach for", () => {
		// The scope was `src/styles/**.css`, which is one file. CSS is not the only place this site writes
		// CSS: an `.astro` component carries its own scoped `<style>`, and a stylesheet added anywhere else
		// under the package would have been unscanned. Every `.css` the package tracks counts now, and every
		// `<style>` body in an `.astro` file, whose relative reaches resolve from the component's own folder.
		const CSS_REACH = /@(?:import|source)\s+['"](\.[^'"]+)['"]/g;
		const STYLE_BLOCK = /<style[^>]*>([\s\S]*?)<\/style>/g;
		const dangling: string[] = [];
		let checked = 0;

		const inPackage = trackedFiles.filter((path) => path.startsWith(`${DOCS}/`));
		const bodies = [
			...inPackage.filter((path) => path.endsWith(".css")).map((file) => ({ file, css: read(file) })),
			...inPackage
				.filter((path) => path.endsWith(".astro"))
				.flatMap((file) => [...read(file).matchAll(STYLE_BLOCK)].map(([, css = ""]) => ({ file, css }))),
		];

		for (const { file, css } of bodies) {
			for (const [, specifier] of css.matchAll(CSS_REACH)) {
				checked += 1;
				if (!existsSync(resolve(ROOT, dirname(file), specifier))) dangling.push(`${file} -> ${specifier}`);
			}
		}

		expect(bodies.length).toBeGreaterThan(1);
		expect(checked).toBeGreaterThanOrEqual(5);
		expect(dangling).toEqual([]);
	});

	// The wiki's copy-pasteable Usage blocks are the largest slice of the cross-package seam and the only
	// one nothing checked: `astro check` registers no MDX plugin, and the citation rules above match file
	// paths rather than exported symbols. A rename in apps/web silently published a wrong import.
	it("imports only symbols apps/web still exports, in the published wiki fences", () => {
		const FENCE = /```(?:tsx?|ts)\n([\s\S]*?)```/g;
		const UI_IMPORT = /import\s*\{([^}]+)\}\s*from\s*["'](@ui\/[^"']+)["']/g;

		const exportsOf = (specifier: string): Set<string> | null => {
			const base = resolveUiSpecifier(specifier);
			const path = [`${base}.tsx`, `${base}.ts`].find((candidate) => existsSync(candidate));
			if (!path) return null;

			const source = readFileSync(path, "utf8");
			const names = new Set<string>();

			for (const [, name] of source.matchAll(
				/export\s+(?:declare\s+)?(?:const|let|function|class|interface|type|enum)\s+(\w+)/g,
			)) {
				names.add(name);
			}
			for (const [, group] of source.matchAll(/export\s*\{([^}]+)\}/g)) {
				for (const entry of group.split(",")) {
					const alias = entry
						.trim()
						.split(/\s+as\s+/)
						.at(-1);
					if (alias) names.add(alias.replace(/^type\s+/, "").trim());
				}
			}

			return names;
		};

		const offenders: string[] = [];
		let checked = 0;

		for (const file of contentFiles) {
			for (const [, fence] of read(file).matchAll(FENCE)) {
				for (const [, names, specifier] of fence.matchAll(UI_IMPORT)) {
					const exported = exportsOf(specifier);
					if (!exported) {
						offenders.push(`${file} -> ${specifier} (no such module)`);
						continue;
					}
					for (const name of names.split(",").map((entry) => entry.replace(/^type\s+/, "").trim())) {
						if (!name) continue;
						checked += 1;
						if (!exported.has(name)) offenders.push(`${file} -> ${specifier} has no ${name}`);
					}
				}
			}
		}

		expect(checked).toBeGreaterThan(50);
		expect(offenders).toEqual([]);
	});

	// The docs site imports app sources, so a change under apps/web has to retrigger the docs workflow or
	// the published site keeps serving the old build. docs.yml enumerates that reach by hand, in two
	// identical trigger blocks, and nothing compared the list against what the site actually imports.
	it("triggers the docs workflow on every apps/web path the docs site reaches into", () => {
		const workflow = read(".github/workflows/docs.yml");
		const watched = [...workflow.matchAll(/^\s+-\s+'([^']+)'$/gm)]
			.map(([, path]) => path)
			.filter((path) => path.startsWith("apps/web"))
			.map((path) => path.replace(/\/\*\*$/, "").replace(SOURCE_FILE, ""));

		// The scan used to stop at `${DOCS}/src/`, which left the two files that decide where the seam points,
		// (`astro.config.ts` and `tsconfig.json`) outside it, along with `e2e/`. Markdown stays out on
		// purpose: a guide linking to an app file is a citation, not something the site builds from.
		const docsSources = trackedFiles.filter(
			(path) => path.startsWith(`${DOCS}/`) && !path.endsWith(".md") && !path.endsWith(".mdx"),
		);
		const reached = new Set<string>();

		// The old form required the segment after the `../` run to be literally `web/`, so an escape written
		// `../../apps/web/src/…` (the same reach, spelled from one directory deeper) matched nothing at all.
		const RELATIVE_ESCAPE = /['"(]((?:\.\.\/)+(?:apps\/)?web\/[^'")]+)['")]/g;

		for (const file of docsSources) {
			const source = read(file);
			for (const [, specifier] of source.matchAll(/from\s+["']@ui\/([^"']+)["']/g)) {
				reached.add(`${UI_ROOT_RELATIVE}/${specifier}`);
			}
			for (const [, specifier] of source.matchAll(RELATIVE_ESCAPE)) {
				reached.add(join(dirname(file), specifier).replace(/\\/g, "/"));
			}
		}

		expect(reached.size).toBeGreaterThan(10);

		const unwatched = [...reached].filter((path) => !watched.some((prefix) => path.startsWith(prefix)));
		expect(unwatched).toEqual([]);
	});

	// The seam was declared three times (the vite alias in `astro.config.ts`, the `paths` entry `astro check`
	// reads, and two hardcoded copies in this file), and nothing compared them, so a move under `apps/web`
	// could satisfy one and break another. `tsconfig.json` is the declaration; everything else derives.
	it("declares the @ui seam target once, in the docs tsconfig", () => {
		expect(docsTsconfigPaths[UI_ALIAS]).toBeDefined();
		expect(existsSync(UI_ROOT)).toBe(true);
		expect(statSync(UI_ROOT).isDirectory()).toBe(true);

		const astroConfig = read(`${DOCS}/astro.config.ts`);
		expect(astroConfig).toContain("tsconfig.json");
		expect(astroConfig, "the vite alias must derive from tsconfig.json, not restate the path").not.toMatch(
			/["'][./]*\.\.\/(?:apps\/)?web\//,
		);
	});

	// An output the `changes` job declares but never writes is the empty string, and a job guarded on
	// `== 'true'` then never runs: silently, with a green tick, forever. `deploy-tail` shipped that way: the
	// Filter step wrote `tail=false` on its no-base-commit early exit and nothing at all on the normal path,
	// so the tail consumer Worker was never deployed while four documents said it was. Nothing catches this
	// by reading the workflow, because both halves are individually well-formed.
	it("writes every output the changes job declares, on both paths through its Filter step", () => {
		const workflow = read(".github/workflows/ci.yml");
		const declared = [
			...(workflow.match(/outputs:\n((?:\s+\w+: \$\{\{ steps\.filter\.outputs\.\w+ \}\}\n)+)/)?.[1] ?? "").matchAll(
				/^\s+(\w+):/gm,
			),
		].map(([, name]) => name);
		const script = workflow.slice(workflow.indexOf("        run: |"), workflow.indexOf("\n  lint:"));
		const [earlyExit, mainPath] = script.split("exit 0");

		expect(declared.length).toBeGreaterThan(1);
		expect(mainPath, "the Filter step has no code after its early exit").toBeTruthy();

		const missingFromEarlyExit = declared.filter((name) => !earlyExit.includes(`echo '${name}=`));
		expect(missingFromEarlyExit, "not written before the early exit, so it stays empty there").toEqual([]);

		// Checking the whole script rather than this half is what let the original defect through: `tail` was
		// written once, on the early-exit path, and a substring search over the script found it there.
		const missingFromMainPath = declared.filter((name) => !mainPath?.includes(`echo '${name}=`));
		expect(missingFromMainPath, "never written on the normal path, so it stays empty on every real run").toEqual([]);
	});

	// `cloudflare/wrangler-action` installs the version its `wranglerVersion` input names, so the docs deploy
	// runs a CLI the manifest does not pin. Renovate bumps the manifest (it is an npm devDependency) and
	// nothing touches the two workflow literals, so the first bump silently desynchronises them. `apps/web`
	// has no equivalent exposure: `_deploy-web.yml` runs `pnpm exec wrangler`, which is the pinned one.
	it("pins wrangler-action to the same wrangler the docs package declares", () => {
		const declared = readJson(`${DOCS}/package.json`).devDependencies.wrangler;
		const inputs = [...read(".github/workflows/docs.yml").matchAll(/wranglerVersion: ["']([^"']+)["']/g)].map(
			([, version]) => version,
		);

		expect(inputs.length).toBeGreaterThan(0);
		expect(inputs.filter((version) => version !== declared)).toEqual([]);
	});

	// CONTEXT.md names one canonical term per concept and lists the retired ones, and the root guide says to
	// use those names "in code, copy and docs". The published wiki is the one place that was unenforced: it
	// kept a second, diverged glossary that headed a section `FilterStrategy` (Avoid: filter) and described
	// a Donation as "a premium purchase" (Avoid: purchase).
	it("heads the published glossary with canonical terms, never retired ones", () => {
		const glossary = read("CONTEXT.md");
		const canonical = new Set([...glossary.matchAll(GLOSSARY_TERM)].map(([, term]) => term.toLowerCase()));
		const retired = new Set(
			[...glossary.matchAll(GLOSSARY_AVOID_LINE)].flatMap(([, list]) =>
				list.split(",").map((entry) => entry.trim().toLowerCase()),
			),
		);

		const wikiGlossary = contentFiles.find((path) => path.endsWith("reference/glossary.mdx"));
		expect(wikiGlossary).toBeDefined();

		const headings = [...read(wikiGlossary as string).matchAll(/^#{2,4} (.+)$/gm)].map(([, heading]) => heading.trim());
		expect(headings.length).toBeGreaterThan(3);

		expect(headings.filter((heading) => retired.has(heading.toLowerCase()))).toEqual([]);
		expect(headings.filter((heading) => !canonical.has(heading.toLowerCase()))).toEqual([]);
	});

	// The rule above reads headings only, and the headings had already been fixed; the prose had not. The
	// glossary's own Bridge entry ended "a **bridge day** is one of the PTO days inside a bridge", and the
	// wiki's front page said "vacation days" twice, both under a canonical heading.
	//
	// Only the **multi-word** retired names are checked, and only those the glossary does not also declare
	// canonical somewhere. A blanket scan is unusable: the retired list holds `type`, `state`, `variant`,
	// `locale`, `filter`, `period` and `break`, which this wiki uses correctly as ordinary technical English
	// on 90 lines: the glossary retires them as names for a *domain concept*, not as words. A compound like
	// "bridge day" or "max working period" has no innocent reading here, so it needs no allowlist at all.
	// `holiday` and `free day` drop out on the canonical test, which is also what lets "public holiday"
	// through: the one phrasing CONTEXT.md blesses for English user-facing copy.
	it("writes the canonical name in the published wiki's prose, not a retired one", () => {
		const glossary = read("CONTEXT.md");
		const canonical = new Set([...glossary.matchAll(GLOSSARY_TERM)].map(([, term]) => term.toLowerCase()));
		const compounds = [
			...new Set(
				[...glossary.matchAll(GLOSSARY_AVOID_LINE)].flatMap(([, list]) =>
					list.split(",").map((entry) => entry.trim().toLowerCase()),
				),
			),
		].filter((term) => term.includes(" ") && !canonical.has(term));

		expect(compounds.length).toBeGreaterThan(10);

		const offenders: string[] = [];
		for (const file of contentFiles) {
			// Frontmatter is metadata, fenced code and inline code are the app's own identifiers, and neither
			// is prose the glossary governs.
			const prose = read(file)
				.replace(/^---[\s\S]*?\n---\n/, "")
				.replace(/```[\s\S]*?```/g, "")
				.replace(/`[^`]*`/g, "");

			for (const term of compounds) {
				const pattern = retiredTermPattern(term);
				for (const [match] of prose.matchAll(pattern)) offenders.push(`${file} -> ${match}`);
			}
		}

		expect(offenders).toEqual([]);
	});

	// IconsGalleryDemo says it is exhaustive, and a rename does break the build through import resolution,
	// but an addition does not, because ICONS is a hand-written array rather than a union over the directory.
	// The 23rd icon would simply be absent from the published gallery.
	it("shows every animated icon in the published gallery", () => {
		const ICONS_DIR = `${WEB}/src/ui/modules/core/animate/icons`;
		const shipped = trackedFiles
			.filter((path) => path.startsWith(`${ICONS_DIR}/`) && path.endsWith(".tsx") && !path.includes(".test."))
			.map((path) => path.slice(ICONS_DIR.length + 1).replace(".tsx", ""))
			.filter((name) => name !== "Icon");

		const gallery = read(`${DOCS}/src/components/demos/IconsGalleryDemo.tsx`);
		const listed = new Set(
			[...gallery.matchAll(/from ["']@ui\/modules\/core\/animate\/icons\/([^"']+)["']/g)].map(([, module]) => module),
		);

		expect(shipped.length).toBeGreaterThan(15);
		expect(shipped.filter((name) => !listed.has(name))).toEqual([]);
	});

	// TokenSwatch and ShadowScale take string[], so a renamed token renders `background: var(--gone)`,
	// transparent, which reads as a legitimate pale colour rather than an error. Nothing else checks these:
	// astro check does not see .mdx, and the citation rules match file paths.
	//
	// Matching `var(--x)` alone read 5 of the 66 tokens those two visualizers actually render: every swatch on
	// the colors and shadows pages arrives as a bare string inside a `tokens={[…]}` array, so the whole brand
	// palette and every `--shadow-brutal-*` sat outside the one rule written for them, and the docs' own
	// components were outside the file set entirely. The floor is on both sides now: with one only on the
	// declared side, prose that stopped naming tokens would empty the citation set and pass this vacuously.
	it("names only design tokens the stylesheets still declare", () => {
		const stylesheets = trackedFiles.filter(
			(path) =>
				path.endsWith(".css") && (path.startsWith(`${WEB}/src/ui/styles/`) || path.startsWith(`${DOCS}/src/styles/`)),
		);
		const fontVariables = [...read(`${WEB}/src/app/fonts.ts`).matchAll(FONT_VARIABLE)].map(([, token]) => token);
		const declared = new Set([
			...stylesheets.flatMap((path) => [...read(path).matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(([, token]) => token)),
			...fontVariables,
		]);

		// `.astro` was outside the file set, and the reason was `SiteTitle.astro` naming three `--sl-*`
		// tokens: Starlight declares those, this repo does not, and the whole extension was excluded to keep
		// them out. That also excluded every token in an `.astro` file that *is* ours, so a typo'd
		// `var(--color-brand-yelow)` there rendered transparent with nothing to catch it. The carve-out is
		// the vendor prefix now, which is what was actually meant.
		const VENDOR_TOKEN = /^--sl-/;
		const citing = [
			...contentFiles.filter((path) => path.includes("/design-system/")),
			...trackedFiles.filter(
				(path) => path.startsWith(`${DOCS}/src/components/`) && (path.endsWith(".tsx") || path.endsWith(".astro")),
			),
		];
		const cited = new Set(
			citing
				.flatMap((path) => {
					const source = read(path);
					return [
						...[...source.matchAll(/var\((--[\w-]+)\)/g)].map(([, token]) => token),
						...[...source.matchAll(/tokens=\{\[([\s\S]*?)\]\}/g)].flatMap(([, list]) =>
							[...list.matchAll(/["'](--[\w-]+)["']/g)].map(([, token]) => token),
						),
						...[...source.matchAll(/token: ["'](--[\w-]+)["']/g)].map(([, token]) => token),
					];
				})
				.filter((token) => !VENDOR_TOKEN.test(token as string)),
		);

		expect(declared.size).toBeGreaterThan(20);
		expect(cited.size).toBeGreaterThan(60);
		expect([...cited].filter((token) => !declared.has(token))).toEqual([]);
	});

	// The four families are spelled in three places and nothing tied them: `next/font/google`'s `variable:` in
	// the app, this site's `:root`, which points those same names at the self-hosted @fontsource faces, and
	// `TypeSpecimen`'s human-readable label. Swap a family over there and `theme/index.css` repoints
	// `--font-sans` at a variable the docs never declare, so the wiki renders in the browser default while the
	// specimen beside it still prints the old family name. The label half stays prose; nothing mechanises it.
	it("declares every font variable the app registers in the docs stylesheet's :root", () => {
		const rootBlocks = [...read(`${DOCS}/src/styles/global.css`).matchAll(/:root\s*\{([^}]*)\}/g)].map(
			([, body]) => body,
		);
		const declared = new Set(
			rootBlocks.flatMap((body) => [...body.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(([, token]) => token)),
		);
		const registered = [...read(`${WEB}/src/app/fonts.ts`).matchAll(FONT_VARIABLE)].map(([, token]) => token);

		expect(registered.length).toBeGreaterThan(3);
		expect(registered.filter((token) => !declared.has(token))).toEqual([]);
	});

	// An override restating the vendor string byte for byte is worse than no override: it pins a value
	// upstream may later correct, and it buries the handful that are real. This file carried eleven keys, of
	// which four were deliberate shortenings; six were copies of Starlight's own Spanish bundle, and the
	// eleventh was the reason the rule exists. `search.ctrlKey` read "Ctrl K" where `Search.astro` renders
	// `<kbd>{ctrlKey}</kbd><kbd>K</kbd>`, so all 76 Spanish pages shipped a search box labelled "Ctrl K K".
	// The vendor bundle is the baseline, so what is left in the file is exactly what this site changes.
	it("overrides only the Starlight strings the docs site actually changes", () => {
		const overrides = trackedFiles.filter(
			(path) => path.startsWith(`${DOCS}/src/content/i18n/`) && path.endsWith(".json"),
		);
		const restated: string[] = [];
		let checked = 0;

		expect(overrides.length).toBeGreaterThan(0);

		for (const file of overrides) {
			const vendor = `${DOCS}/node_modules/@astrojs/starlight/translations/${basename(file, ".json")}.json`;
			expect(existsSync(join(ROOT, vendor)), `${vendor} is absent, so this rule would read nothing`).toBe(true);

			const defaults: Record<string, string> = readJson(vendor);
			for (const [key, value] of Object.entries(readJson(file) as Record<string, string>)) {
				checked += 1;
				if (defaults[key] === value) restated.push(`${file} -> ${key} restates the Starlight default`);
			}
		}

		expect(checked).toBeGreaterThan(0);
		expect(restated).toEqual([]);
	});

	// The rule above is named for `search.ctrlKey` and cannot see it. It flags an override byte-identical to
	// the vendor string, and the defect was `"Ctrl K"` against a vendor `"Ctrl"`: not equal, so not flagged,
	// so re-adding the key would reship "Ctrl K K" on all 76 Spanish pages with the suite green.
	//
	// Starlight renders the value in a `<kbd>` of its own beside a literal `<kbd>K</kbd>`, so the only
	// correct value is a modifier on its own. That is what this asserts, and the vendor markup is read first
	// so the rule fails loudly rather than quietly if upstream stops rendering the K itself.
	//
	// What it does not cover: any other key. There is no general test for "the default plus more" because a
	// legitimate reword may well contain the default as a substring; this key is checkable because its
	// rendered shape is fixed, and the others are prose.
	it("overrides search.ctrlKey with a modifier alone, because Starlight renders the K itself", () => {
		const SEARCH_SHORTCUT = /<kbd>\{[^}]*search\.ctrlKey[^}]*\}<\/kbd><kbd>K<\/kbd>/;
		const MODIFIER_ALONE = /^\S{1,5}$/;
		const search = `${DOCS}/node_modules/@astrojs/starlight/components/Search.astro`;

		expect(existsSync(join(ROOT, search)), `${search} is absent, so this rule would read nothing`).toBe(true);
		expect(SEARCH_SHORTCUT.test(read(search))).toBe(true);

		// No floor on the count: the key is absent from the overrides today, which is the state this rule
		// exists to keep. The vendor-markup assertion above is what stops it reading nothing by accident.
		const offenders: string[] = [];

		for (const file of trackedFiles.filter(
			(path) => path.startsWith(`${DOCS}/src/content/i18n/`) && path.endsWith(".json"),
		)) {
			const value = (readJson(file) as Record<string, string>)["search.ctrlKey"];
			if (value === undefined) continue;
			if (!MODIFIER_ALONE.test(value) || /k$/i.test(value))
				offenders.push(`${file} -> search.ctrlKey is "${value}", and Starlight appends the K`);
		}

		expect(offenders).toEqual([]);
	});

	it("prints repo-relative paths in the published wiki, never package-relative ones", () => {
		// A trailing `/*` makes the token a path-alias specifier rather than a path: `src/*` is the ninth entry
		// in the web tsconfig's `paths` and is spelled exactly that way there, so the alias table has to print
		// it verbatim. No file is named `*`, so exempting the wildcard form costs this rule nothing.
		const ambiguous = /^(src|e2e|workers|public)\/(?!\*$)/;
		const offenders: string[] = [];
		for (const file of contentFiles) {
			for (const [, token] of read(file).matchAll(BACKTICKED_TOKEN)) {
				if (ambiguous.test(token)) offenders.push(`${file} -> ${token}`);
			}
		}
		expect(offenders).toEqual([]);
	});
});

describe("apps/web/src carries no explanatory comments", () => {
	// A suppression changes what the linter does, and a generated file's banner is not ours to delete.
	// Both comment forms count: a11y suppressions on JSX are written `{/* biome-ignore … */}`.
	const ALLOWED = /(?:\/\/|\/\*)\s*(biome-ignore\b|Auto-generated by\b)/;
	const webSources = sourceFiles.filter((path) => path.startsWith(`${WEB}/src/`));

	// This parses the file rather than matching comment delimiters by hand. Four hand-rolled versions were
	// written and every one was wrong somewhere: a URL inside a multi-line template read as a comment; a stray
	// backtick switched the rule off for the rest of the file; an escaped backtick did the same by flipping a
	// parity count; a character class swallowed the delimiter it was meant to protect. JavaScript's lexical
	// grammar is not a regular language. Scanning alone is not enough either: only the parser knows whether a
	// slash opens a regex or divides, so a regex literal holding an escaped slash reads as a comment to a bare
	// scanner. Comments are trivia, so they hang off node boundaries rather than appearing in the tree.
	interface CommentsInParams {
		path: string;
		source: string;
	}

	const commentsIn = ({ path, source }: CommentsInParams) => {
		const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
		const seen = new Set<number>();
		const found: { line: number; text: string }[] = [];

		const collect = (ranges: ts.CommentRange[] | undefined) => {
			for (const range of ranges ?? []) {
				if (seen.has(range.pos)) continue;
				seen.add(range.pos);
				found.push({
					line: parsed.getLineAndCharacterOfPosition(range.pos).line + 1,
					text: source.slice(range.pos, range.end),
				});
			}
		};

		const walk = (node: ts.Node) => {
			collect(ts.getLeadingCommentRanges(source, node.pos));
			collect(ts.getTrailingCommentRanges(source, node.end));
			// `{/* … */}` holds its comment between the braces, so it is trivia of nothing the walk reaches. It
			// has to be asked for as *trailing*: TypeScript only calls a comment leading when a line break comes
			// first, and here the brace does. This is the shape every a11y suppression on JSX takes.
			if (ts.isJsxExpression(node)) collect(ts.getTrailingCommentRanges(source, node.getStart() + 1));
			// `forEachChild` yields nodes but never punctuation tokens, so a comment sitting against a `{`, `}`,
			// `]` or `)` is trivia of nothing it reaches: the last line inside a block escaped entirely, which
			// is how a probe file with an explanatory comment was committed under `src/` while this was green.
			// `getChildren` includes the tokens, and needs the `setParentNodes` argument above to be true.
			for (const child of node.getChildren(parsed)) walk(child);
		};

		walk(parsed);
		return found.sort((a, b) => a.line - b.line);
	};

	it("has app sources to check at all", () => {
		expect(webSources.length).toBeGreaterThan(100);
	});

	it("leaves the rationale in the folder guides instead", () => {
		const offenders: string[] = [];
		for (const file of webSources) {
			const source = read(file);
			// parsing every file is what made this rule time out under parallel load; a file holding neither
			// delimiter anywhere cannot hold a comment, and that is most of them
			if (!source.includes("//") && !source.includes("/*")) continue;

			for (const { line, text } of commentsIn({ path: file, source })) {
				if (!ALLOWED.test(text)) offenders.push(`${file}:${line}`);
			}
		}
		expect(offenders).toEqual([]);
	});
});

describe("the succeeded-payment status is one value in both languages", () => {
	// A payments row *is* the Premium entitlement (ADR 0008), so `succeeded` is the whole of the access rule.
	// It is declared once in the domain, as `PAYMENT_SUCCEEDED`, and written four more times as a bare literal
	// inside the repository's SQL, which is the half no typechecker reads: rename the union member, or write a
	// fifth predicate against a different spelling, and every gate stays green while
	// `getSucceededPaymentByEmail` quietly stops matching and no donor recovers Premium again.
	//
	// Stripe owns the value, so nothing in this tree can produce a divergent one and the illegal state is not
	// reachable today. That makes it a guard rather than a defect, and an assertion the proportionate answer:
	// interpolating the constant into four SQL strings would buy a coupling to a word Stripe cannot change and
	// pay for it by making the statements less readable than the SQL they are.
	const PAYMENTS_REPOSITORY = `${WEB}/src/infrastructure/services/payments/repository.ts`;
	const SQL_STATUS_COMPARISON = /status\s*(?:!=|=)\s*'([^']*)'|WHEN \? = '([^']*)'/g;
	const SUCCEEDED_LITERAL = /['"]succeeded['"]/;
	const PAYMENT_STATUS_MODULE = `${WEB}/src/domain/payment/events/types.ts`;

	it("compares the status column against that value and no other, in every SQL predicate", () => {
		const compared = [...read(PAYMENTS_REPOSITORY).matchAll(SQL_STATUS_COMPARISON)].map(
			([, quoted, whenQuoted]) => quoted ?? whenQuoted,
		);

		// A floor, because a rewritten statement that stops matching the pattern would otherwise satisfy an
		// empty set: the rule has to fail when it can no longer see the predicates it exists to compare.
		expect(compared.length).toBeGreaterThanOrEqual(4);
		expect([...new Set(compared)]).toEqual([PAYMENT_SUCCEEDED]);
	});

	// Production sources only. A test asserting the SQL has to write the wire value out, and
	// `repository.test.ts` does exactly that, deliberately.
	it("lets no production module that imports the constant spell the literal beside it", () => {
		const offenders = sourceFiles
			.filter((path) => path.startsWith(`${WEB}/src/`) && path !== PAYMENT_STATUS_MODULE)
			.filter((path) => !/\.test\.tsx?$/.test(path))
			.filter((path) => {
				const source = read(path);
				return source.includes("PAYMENT_SUCCEEDED") && SUCCEEDED_LITERAL.test(source);
			});

		expect(offenders).toEqual([]);
	});
});

describe("directives sit where the compiler can see them", () => {
	// A directive is a bare string literal as the file's first statement. Wrap it in parentheses or let an
	// import sort above it and it silently becomes an ordinary expression: `'use client'` stops applying, the
	// module is treated as a Server Component, and nothing here notices. Typecheck passes, Biome passes, every
	// unit test passes; only `next build` fails, in CI, on a full production build. Six planner files spent
	// several commits in that state after an added import was hoisted over the directive and the formatter
	// parenthesised what was left behind.
	const DIRECTIVES = new Set(["use client", "use server", "use cache", "use strict"]);
	const packageSources = sourceFiles.filter(
		(path) => path.startsWith(`${WEB}/src/`) || path.startsWith(`${DOCS}/src/`),
	);

	it("has sources to check at all", () => {
		expect(packageSources.length).toBeGreaterThan(100);
	});

	it("keeps every directive a bare string literal in first position", () => {
		const offenders: string[] = [];

		for (const file of packageSources) {
			const source = read(file);
			if (!/['"]use (client|server|cache|strict)['"]/.test(source)) continue;

			const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

			parsed.statements.forEach((statement, index) => {
				if (!ts.isExpressionStatement(statement)) return;

				let expression = statement.expression;
				let parenthesised = false;
				while (ts.isParenthesizedExpression(expression)) {
					parenthesised = true;
					expression = expression.expression;
				}
				if (!ts.isStringLiteral(expression) || !DIRECTIVES.has(expression.text)) return;

				const line = parsed.getLineAndCharacterOfPosition(statement.getStart(parsed)).line + 1;
				if (parenthesised)
					offenders.push(`${file}:${line} '${expression.text}' is parenthesised, so it is not a directive`);
				else if (index !== 0) offenders.push(`${file}:${line} '${expression.text}' is not the first statement`);
			});
		}

		expect(offenders).toEqual([]);
	});
});

describe("the published layer graph is the one the imports make", () => {
	// The overview page drew `app -> ui -> application -> domain` for as long as nobody walked the tree. Five
	// of the sixteen production edges were on it, `app -> infrastructure` (63 imports across 20 files) was not,
	// and one arrow head carried a call path rather than an import. A diagram read off the intent will always
	// drift back to the intent, so the page publishes a counted table and this rule counts the same thing.
	//
	// Tests are excluded on both sides: a `vi.mock` of another layer is a fact about the test, not about what
	// ships. Every alias that resolves inside `apps/web/src` is followed, which is the half the old prose rule
	// missed: `@i18n/`, `@styles/` and `@assets/` all land in `src/ui/`, so an `@i18n/...` import is a
	// `ui` edge however little it looks like one.
	const WEB_SRC = `${WEB}/src`;
	const LAYER_NAMES = ["app", "application", "domain", "infrastructure", "ui"];
	const MIDDLEWARE_NODE = "middleware.ts";
	const OVERVIEW = `${DOCS}/src/content/docs/architecture/overview.mdx`;
	const GRAPH_TABLE_HEADER = "from / to";
	const IMPORT_SPECIFIER =
		/from\s*["']([^"']+)["']|import\s*\(\s*["'`]([^"'`]+)["'`]\s*\)|(?:^|\n)\s*import\s*["']([^"']+)["']|require\s*\(\s*["']([^"']+)["']\s*\)|vi\.mock\(\s*["']([^"']+)["']/g;

	// Derived from the tsconfig rather than restated, so a new alias is followed the day it is declared.
	const aliasTargets = Object.entries(webTsconfigPaths).map(
		([alias, [target]]) =>
			[
				alias.replace(ALIAS_WILDCARD_SUFFIX, ""),
				`${WEB}/${(target ?? "").replace(ALIAS_WILDCARD_SUFFIX, "").replace(/^\.\//, "")}`,
			] as const,
	);

	const nodeOf = (path: string): string | null => {
		if (!path.startsWith(`${WEB_SRC}/`)) return null;
		const rest = path.slice(WEB_SRC.length + 1);
		if (rest === MIDDLEWARE_NODE) return MIDDLEWARE_NODE;
		const [head] = rest.split("/");
		return head && LAYER_NAMES.includes(head) ? head : null;
	};

	interface Edge {
		from: string;
		to: string;
	}

	const productionSources = sourceFiles.filter((path) => path.startsWith(`${WEB_SRC}/`) && !/\.test\.tsx?$/.test(path));

	const reaches: (Edge & { file: string })[] = [];
	for (const file of productionSources) {
		const from = nodeOf(file);
		if (!from) continue;
		const source = read(file);
		IMPORT_SPECIFIER.lastIndex = 0;
		let match: RegExpExecArray | null = IMPORT_SPECIFIER.exec(source);
		while (match !== null) {
			const specifier = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5];
			const alias = specifier ? aliasTargets.find(([prefix]) => specifier.startsWith(prefix)) : undefined;
			const target = alias && specifier ? `${alias[1]}${specifier.slice(alias[0].length)}` : null;
			const to = target ? nodeOf(target) : null;
			if (to && to !== from) reaches.push({ from, to, file });
			match = IMPORT_SPECIFIER.exec(source);
		}
	}

	const measured = new Map<string, string>();
	for (const { from, to } of reaches) {
		const key = `${from} -> ${to}`;
		const all = reaches.filter((edge) => edge.from === from && edge.to === to);
		measured.set(key, `${all.length}/${new Set(all.map((edge) => edge.file)).size}`);
	}

	// The table is read as data: the header names the columns, every later row names its own source node.
	const publishedGraph = () => {
		// One contiguous run of rows, not every table row on the page: the alias table further down is also a
		// table, and a filter over the whole file swallowed it and invented ten edges out of its cells.
		const lines = read(OVERVIEW).split(/\r?\n/);
		const header = lines.findIndex(
			(line) => TABLE_ROW.test(line) && line.split("|")[1]?.trim().replace(/`/g, "") === GRAPH_TABLE_HEADER,
		);
		if (header < 0) return null;

		const run = [lines[header] ?? ""];
		for (const line of lines.slice(header + 1)) {
			if (!TABLE_ROW.test(line)) break;
			run.push(line);
		}
		const rows = run.map((line) =>
			line
				.trim()
				.slice(1, -1)
				.split("|")
				.map((cell) => cell.trim().replace(/`/g, "")),
		);

		const columns = rows[0]?.slice(1) ?? [];
		const published = new Map<string, string>();
		for (const row of rows.slice(1)) {
			const [from, ...cells] = row;
			if (!from || TABLE_SEPARATOR_ROW.test(row.join("|"))) continue;
			cells.forEach((cell, index) => {
				const to = columns[index];
				if (to && cell) published.set(`${from} -> ${to}`, cell);
			});
		}

		return published;
	};

	it("finds the counted table on the architecture overview at all", () => {
		expect(publishedGraph()?.size ?? 0).toBeGreaterThan(10);
		expect(measured.size).toBeGreaterThan(10);
	});

	it("draws every edge the tree has, with the counts the tree has", () => {
		const published = publishedGraph() ?? new Map<string, string>();
		const wrong = [...measured.entries()]
			.filter(([edge, counts]) => published.get(edge) !== counts)
			.map(([edge, counts]) => `${edge} is ${counts}, published as ${published.get(edge) ?? "no edge"}`);

		expect(wrong).toEqual([]);
	});

	it("draws no edge the tree does not have", () => {
		const published = publishedGraph() ?? new Map<string, string>();
		const invented = [...published.keys()].filter((edge) => !measured.has(edge));

		expect(invented).toEqual([]);
	});

	// The layer contract this replaced said "must not import from `@ui/*`" and asserted that nothing did.
	// `@i18n/`, `@styles/` and `@assets/` all resolve inside `src/ui/`, so seven imports walked past the rule
	// while it read as enforced. Two files reach the locale bundles and are named here; a third, or a reach
	// into anything but `i18n/messages/`, is what this catches.
	const UI_DATA_IMPORTERS = new Set([
		`${WEB_SRC}/infrastructure/i18n/config.ts`,
		`${WEB_SRC}/infrastructure/markdown/buildMarkdownPage.ts`,
	]);
	const LOCALE_BUNDLE = `${WEB_SRC}/ui/i18n/messages/`;

	// The anti-corruption layer only works while the foreign shape stops at it. `Raw*` is spellable in
	// `application/dto/` and in the adapter that produces it (`services/holidays/source/`, eight files);
	// anywhere past the mapper means a mapping step was skipped. The dto guide stated the rule as if it
	// reached nowhere outside the folder, which the adapter has always contradicted, so the half that is
	// true is the half asserted here.
	const RAW_TYPE = /\bRaw[A-Z]\w*/;
	const PAST_THE_MAPPER = [
		`${WEB_SRC}/app/`,
		`${WEB_SRC}/domain/`,
		`${WEB_SRC}/ui/`,
		`${WEB_SRC}/application/stores/`,
		`${WEB_SRC}/application/use-cases/`,
	];

	it("keeps every foreign Raw shape on the upstream side of the DTO seam", () => {
		const checked = sourceFiles.filter((path) => PAST_THE_MAPPER.some((prefix) => path.startsWith(prefix)));
		const offenders = checked.filter((path) => RAW_TYPE.test(read(path)));

		expect(checked.length).toBeGreaterThan(100);
		expect(offenders).toEqual([]);
	});

	it("lets infrastructure reach nothing under src/ui but the two locale-bundle readers", () => {
		const offenders = reaches
			.filter(({ from, to }) => from === "infrastructure" && to === "ui")
			.filter(({ file }) => !UI_DATA_IMPORTERS.has(file))
			.map(({ file }) => file);

		expect([...new Set(offenders)]).toEqual([]);
	});

	it("keeps those two on the locale bundles and nothing else in the ui layer", () => {
		const strayed: string[] = [];
		for (const file of UI_DATA_IMPORTERS) {
			const source = read(file);
			IMPORT_SPECIFIER.lastIndex = 0;
			let match: RegExpExecArray | null = IMPORT_SPECIFIER.exec(source);
			while (match !== null) {
				const specifier = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5];
				const alias = specifier ? aliasTargets.find(([prefix]) => specifier.startsWith(prefix)) : undefined;
				const target = alias && specifier ? `${alias[1]}${specifier.slice(alias[0].length)}` : null;
				if (target && nodeOf(target) === "ui" && !target.startsWith(LOCALE_BUNDLE)) {
					strayed.push(`${file} -> ${specifier}`);
				}
				match = IMPORT_SPECIFIER.exec(source);
			}
		}

		expect(strayed).toEqual([]);
	});
});

describe("the guides describe the project as it is configured", () => {
	// Backticked `foo/*` tokens are aliases; the dot filter drops the wrangler route pattern
	// `forever-pto.com/*`. Whole backticked tokens, not substrings: the rule this replaced stripped the
	// `/*` and searched the raw file, so `@app` matched inside `@application` and `src/*` reduced to `src`,
	// and either alias could be deleted from the guide with every assertion still green.
	const documentedAliases = new Set([...webGuide.matchAll(BACKTICKED_ALIAS)].map(([, alias]) => alias));
	// The same table is published on the architecture overview, and this rule read only the guide, so the wiki
	// copy carried `@mocks/*` and `@types/*` (neither declared, neither directory existing) for as long as
	// nobody opened the tsconfig beside it. Both copies are held to the declaration now.
	//
	// The page's table is read as a table rather than scanned like the guide: the prose around it names the
	// two aliases it is explaining are *gone*, and a whole-page scan reads those as declarations, along with
	// every backticked `<something>/*` in a sentence. The first column of the run under the `Alias` header is
	// the list; nothing else on the page is.
	const OVERVIEW_PAGE = `${DOCS}/src/content/docs/architecture/overview.mdx`;
	const ALIAS_TABLE_HEADER = "Alias";
	const publishedAliases = (() => {
		const lines = read(OVERVIEW_PAGE).split(/\r?\n/);
		const header = lines.findIndex((line) => TABLE_ROW.test(line) && line.split("|")[1]?.trim() === ALIAS_TABLE_HEADER);
		if (header < 0) return new Set<string>();

		const found = new Set<string>();
		for (const line of lines.slice(header + 1)) {
			if (!TABLE_ROW.test(line)) break;
			const cell = line.split("|")[1]?.trim() ?? "";
			for (const [, alias] of cell.matchAll(BACKTICKED_ALIAS)) found.add(alias);
		}

		return found;
	})();
	// The unfiltered citations only. A `--filter`/`-F`/`--dir`/`-C` invocation names the manifest it means,
	// so it is resolved against that one rather than against whichever of the three happens to have the
	// script, by the rule further down.
	const citedScripts = (guide: string) => [
		...new Set(
			pnpmCitations(guide)
				.filter(({ pkg }) => pkg === null)
				.map(({ script }) => script),
		),
	];

	it("cites only root scripts that the root manifest has", () => {
		expect(citedScripts(rootGuide).filter((script) => !(script in rootScripts))).toEqual([]);
	});

	// A README is where someone copies a command from, so a script it names has to exist somewhere
	// a reader could run it: the root, or the package the README belongs to.
	it.each([
		["README.md", rootScripts],
		[`${WEB}/README.md`, { ...rootScripts, ...webScripts }],
		[`${DOCS}/README.md`, { ...rootScripts, ...docsScripts }],
		[`${DOCS}/CLAUDE.md`, { ...rootScripts, ...docsScripts }],
	])("%s cites only scripts a reader could run", (file, available) => {
		expect(citedScripts(readIfPresent(file)).filter((script) => !(script in available))).toEqual([]);
	});

	// A workflow is the one citation site that fails in CI rather than under a reader, and it was unchecked:
	// `docs.yml`'s Typecheck step ran `pnpm --filter forever-pto-docs check`, a script the docs manifest has
	// never had. Every job runs from the repo root or from one of the two packages, so a bare script has to
	// resolve in one of the three manifests.
	//
	// `docs.yml` reached this rule asserting `[] === []`, which is the workflow the rule was written for:
	// all four of its pnpm invocations are filter-form, and the bare pattern this used to read could not see
	// one. Both forms are checked here now, and the count of invocations the parser could read is compared
	// with the count present, so the next spelling nobody anticipated fails loudly instead of emptying the
	// citation list.
	it.each(workflowFiles)("%s runs only scripts a manifest declares", (file) => {
		const commands = runCommands(read(file));
		const available = { ...rootScripts, ...webScripts, ...docsScripts };

		const present = (commands.match(PNPM_INVOCATION_START) ?? []).length;
		const parsed = [...commands.matchAll(PNPM_INVOCATION)].length;
		expect({ file, parsed }).toEqual({ file, parsed: present });

		const offenders = pnpmCitations(commands).flatMap(({ pkg, script }) => {
			if (pkg === null) return script in available ? [] : [`pnpm ${script}`];
			const scripts = scriptsByPackageRef.get(pkg);
			if (!scripts) return [`pnpm --filter ${pkg} (no such workspace package)`];
			return script in scripts ? [] : [`pnpm --filter ${pkg} ${script}`];
		});

		expect(offenders).toEqual([]);
	});

	it.each(workflowFiles.map((file) => file.slice(WORKFLOW_DIR.length + 1)))(
		"%s is documented in both places that claim to list every workflow",
		(name) => {
			const rootGuide = read("CLAUDE.md");
			const wiki = read(`${DOCS}/src/content/docs/infra/workflows.mdx`);

			// A bare `includes(name)` was not a listing test: `ci.yml` is named twelve times in that guide,
			// so deleting the paragraph that documents it and leaving any one incidental mention kept this
			// green. The guide links every workflow it lists to the file, and the link is what a reader
			// follows, so that is the thing to require.
			const linked = new RegExp(String.raw`\]\([^)]*\.github/workflows/${escapeForRegExp(name)}\)`);

			expect({ rootGuide: linked.test(rootGuide), wiki: wiki.includes(`## \`${name}\``) }).toEqual({
				rootGuide: true,
				wiki: true,
			});
		},
	);

	// This saw two of the four deploys this repo runs, and its floor of `> 1` was satisfied by both of them,
	// so the two it could not see were unguarded. `docs.yml` deploys twice through `cloudflare/wrangler-action`,
	// whose script arrives on a `command:` input rather than in the step text, and a script name reaches a
	// deploy of its own: `apps/docs`'s `deploy` is `astro build && wrangler deploy`. Replacing the docs
	// production deploy with a retry-wrapped `pnpm --filter forever-pto-docs deploy` kept the count at two,
	// kept `wrapped` empty, and retried a wrangler deploy three times on an argv error. The floor tracks the
	// four the repo actually has, so losing sight of one fails rather than passes.
	it("runs every wrangler deploy without a retry wrapper, so an argv error reports on the first attempt", () => {
		const wrapped: string[] = [];
		let deploySteps = 0;

		for (const file of workflowFiles) {
			for (const step of read(file).split("- name:")) {
				const deploys =
					DEPLOY_TOOL_COMMAND.test(step) ||
					(step.includes("cloudflare/wrangler-action") && WRANGLER_ACTION_DEPLOY.test(step)) ||
					pnpmCitations(step).some((citation) => DEPLOY_TOOL_COMMAND.test(expandScript({ citation })));
				if (!deploys) continue;
				deploySteps += 1;
				if (step.includes("nick-fields/retry")) wrapped.push(`${file} ->${step.split(/\r?\n/)[0] ?? ""}`);
			}
		}

		expect(deploySteps).toBeGreaterThan(3);
		expect(wrapped).toEqual([]);
	});

	// The deploy census cannot see a secret write, and a secret write is where the wrapper survived the last
	// pass: `wrangler secret bulk` and `wrangler secret put` each ran inside one, retrying a missing value
	// three times fifteen seconds apart before saying which variable was empty. Both are folded into the
	// deploy through `--secrets-file` now, so on most days this rule finds nothing at all: it deliberately
	// carries no floor, because a floor of one would fail the moment the last `wrangler secret` step went
	// away, which is the state this repository is trying to be in.
	it("runs any wrangler secret write without a retry wrapper, whether or not one still exists", () => {
		const wrapped: string[] = [];

		for (const file of workflowFiles) {
			for (const step of read(file).split("- name:")) {
				if (!SECRET_TOOL_COMMAND.test(step)) continue;
				if (step.includes("nick-fields/retry")) wrapped.push(`${file} ->${step.split(/\r?\n/)[0] ?? ""}`);
			}
		}

		expect(wrapped).toEqual([]);
	});

	// The same reasoning one command over. A build fails deterministically far more often than it fails for a
	// reason a second attempt can fix, and the web build carried `max_attempts: 3` with `timeout_minutes: 10`,
	// so a type error or a config error burned up to half an hour before it reported.
	it("runs every build without a retry wrapper, so a deterministic failure reports on the first attempt", () => {
		const wrapped: string[] = [];
		let buildSteps = 0;

		for (const file of workflowFiles) {
			for (const step of read(file).split("- name:")) {
				const builds =
					BUILD_TOOL_COMMAND.test(step) ||
					pnpmCitations(step).some(
						(citation) =>
							BUILD_SCRIPT_NAME.test(citation.script) || BUILD_TOOL_COMMAND.test(expandScript({ citation })),
					);
				if (!builds) continue;
				buildSteps += 1;
				if (step.includes("nick-fields/retry")) wrapped.push(`${file} ->${step.split(/\r?\n/)[0] ?? ""}`);
			}
		}

		expect(buildSteps).toBeGreaterThan(1);
		expect(wrapped).toEqual([]);
	});

	// The cleanup used to declare one workflow-level group, `ci.yml`'s, over both of its jobs. That queued
	// `cleanup-docs` behind the wrong workflow: the Worker it deletes is deployed by the `preview` job in
	// `docs.yml`, which has a group of its own, so the delete could land while that preview was still being
	// used. Each job carries its own group now, and each is checked against the workflow that actually
	// deploys the Worker that job deletes.
	it.each([
		["cleanup-web", "ci.yml"],
		["cleanup-docs", "docs.yml"],
	])("queues %s behind the run whose preview Worker it deletes", (job, file) => {
		const deployer = read(`${WORKFLOW_DIR}/${file}`);
		const deployerConcurrency = yamlBlock({ workflow: deployer, key: "concurrency" });
		const cleanupConcurrency = yamlBlock({
			workflow: jobBody({ workflow: read(`${WORKFLOW_DIR}/cleanup-development.yml`), job }),
			key: "concurrency",
		});
		const workflowName = /^name:[ \t]*(.+)$/m.exec(deployer)?.[1]?.trim() ?? "";

		expect(workflowName).not.toBe("");
		expect(deployerConcurrency.group).toBeDefined();
		expect(cleanupConcurrency.group).toBe(
			(deployerConcurrency.group ?? "").replace(GITHUB_WORKFLOW_EXPRESSION, workflowName),
		);
		expect(cleanupConcurrency["cancel-in-progress"]).toBe("false");
	});

	it("gates the tail Worker deploy on every path its bundle is built from", () => {
		const tailRoot = `${WEB}/workers/tail`;
		const filter = /TAIL_PATHS: '([^']+)'/.exec(read(`${WORKFLOW_DIR}/ci.yml`))?.[1] ?? "";
		const pattern = new RegExp(filter);
		const sources = trackedFiles.filter((path) => path.startsWith(`${tailRoot}/`) && SOURCE_FILE.test(path));
		const reached = new Set<string>();
		const pending = [...sources];

		// A reach the resolver cannot place is a failure, not an exemption. The first version appended `.ts`
		// and nothing else, so `"./foo"` meaning `foo/index.ts` and a NodeNext `"./foo.js"` both produced a
		// path that does not exist; the final filter then guarded itself with `existsSync`, so exactly the
		// specifiers it could not follow were the ones it let through. The `not.toEqual([])` floor did not
		// notice either: one unresolvable entry is a non-tail entry and satisfies it on its own.
		const unresolved: string[] = [];

		while (pending.length > 0) {
			const file = pending.pop() as string;

			for (const [, specifier] of read(file).matchAll(/from\s+["'](\.[^"']+)["']/g)) {
				const resolved = resolveRelativeImport({ from: file, specifier: specifier as string });
				if (!resolved) {
					unresolved.push(`${file} -> ${specifier}`);
					continue;
				}
				if (reached.has(resolved)) continue;
				reached.add(resolved);
				pending.push(resolved);
			}
		}

		expect(filter).not.toBe("");
		expect(sources.length).toBeGreaterThan(0);
		expect(unresolved).toEqual([]);
		expect([...reached].filter((path) => !path.startsWith(`${tailRoot}/`))).not.toEqual([]);
		expect([...reached].filter((path) => !pattern.test(path))).toEqual([]);
	});

	// The filtered form names its own package, so it can be checked wherever it is written, including the
	// published wiki, where a bare `pnpm build` is ambiguous between three manifests and this one is not.
	// It was invisible to the rule above: `\bpnpm ` matches and `[a-z]` then meets the `-` of `--filter`, so
	// the whole match fails and the line yields no script at all.
	it("resolves every filtered pnpm citation against the package it names", () => {
		const sources = [
			"CLAUDE.md",
			"README.md",
			"CONTRIBUTING.md",
			...PACKAGE_GUIDES,
			...WORKSPACE_PACKAGES.map((pkg) => `${pkg}/README.md`),
			...contentFiles,
			...workflowFiles,
		];

		const offenders: string[] = [];
		let checked = 0;

		for (const file of sources) {
			const body = file.startsWith(WORKFLOW_DIR) ? runCommands(read(file)) : readIfPresent(file);
			for (const { pkg, script } of pnpmCitations(body)) {
				if (pkg === null) continue;
				checked += 1;
				const scripts = scriptsByPackageRef.get(pkg);
				if (!scripts) offenders.push(`${file} -> --filter ${pkg} (no such workspace package)`);
				else if (!(script in scripts)) offenders.push(`${file} -> ${pkg} has no ${script} script`);
			}
		}

		expect(checked).toBeGreaterThan(3);
		expect(offenders).toEqual([]);
	});

	it("cites only web scripts that resolve in the web or root manifest", () => {
		const unknown = citedScripts(webGuide).filter((script) => !(script in webScripts) && !(script in rootScripts));
		expect(unknown).toEqual([]);
	});

	it("documents every path alias the web tsconfig declares", () => {
		expect(Object.keys(webTsconfigPaths).filter((alias) => !documentedAliases.has(alias))).toEqual([]);
	});

	it("documents no path alias the web tsconfig does not declare", () => {
		expect([...documentedAliases].filter((alias) => !(alias in webTsconfigPaths))).toEqual([]);
	});

	it("publishes every path alias the web tsconfig declares", () => {
		expect(Object.keys(webTsconfigPaths).filter((alias) => !publishedAliases.has(alias))).toEqual([]);
	});

	it("publishes no path alias the web tsconfig does not declare", () => {
		expect([...publishedAliases].filter((alias) => !(alias in webTsconfigPaths))).toEqual([]);
	});

	it("declares no alias pointing at a directory that does not exist", () => {
		const dangling = Object.entries(webTsconfigPaths).filter(([, [target]]) => {
			const path = resolve(ROOT, WEB, (target ?? "").replace(ALIAS_WILDCARD_SUFFIX, ""));
			return !existsSync(path) || !statSync(path).isDirectory();
		});
		expect(dangling.map(([alias]) => alias)).toEqual([]);
	});

	// `next build` rewrites apps/web/tsconfig.json on every run and fills in its own defaults for any key
	// that is absent: `strict: false` and `allowJs: true`. Both would land at the next build rather than at
	// the deletion site, so neither is safe to drop as redundant.
	it("keeps strict on, because next build writes it false when the key is missing", () => {
		expect(webTsconfigOptions.strict).toBe(true);
	});

	it("keeps JavaScript out, because next build writes allowJs true when the key is missing", () => {
		expect(webTsconfigOptions.allowJs).toBe(false);
	});

	// `include` is `**/*.ts`, so a generated .d.ts at the package root joins the program and the workerd
	// globals in it replace lib.dom's Response. Both halves of the guard are asserted because either alone
	// is useless. The ignore half is asked of git rather than matched against .gitignore as a substring,
	// so an unanchored pattern that stops covering the file is caught.
	it("keeps the generated Cloudflare env types out of the program and out of git", () => {
		expect(webTsconfigExclude).toContain(GENERATED_ENV_TYPES);
		expect(isGitIgnored(`${WEB}/${GENERATED_ENV_TYPES}`)).toBe(true);
	});

	it("references no identifier the web environment types do not import", { timeout: 30_000 }, () => {
		const entry = join(ROOT, WEB, HAND_WRITTEN_ENV_TYPES);
		const program = ts.createProgram([entry], {
			noResolve: true,
			noEmit: true,
			skipLibCheck: false,
			strict: true,
			target: ts.ScriptTarget.ESNext,
			lib: ["lib.esnext.d.ts", "lib.dom.d.ts"],
		});
		const unbound = ts
			.getPreEmitDiagnostics(program)
			.filter(
				(diagnostic) => diagnostic.code === UNDECLARED_NAME && diagnostic.file?.fileName === entry.replace(/\\/g, "/"),
			)
			.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));

		expect(unbound).toEqual([]);
	});
});

describe("translation bundles stay in step", () => {
	const localeFiles = readdirSync(join(ROOT, LOCALES_DIR)).filter((file) => file.endsWith(".json"));
	interface FlattenParams {
		value: unknown;
		path?: string;
		out?: string[];
	}

	const flatten = ({ value, path = "", out = [] }: FlattenParams) => {
		if (value && typeof value === "object" && !Array.isArray(value)) {
			for (const [key, child] of Object.entries(value))
				flatten({ value: child, path: path ? `${path}.${key}` : key, out });
		} else out.push(path);
		return out;
	};
	const keysOf = (file: string) => flatten({ value: JSON.parse(read(`${LOCALES_DIR}/${file}`)) }).sort();
	const reference = keysOf("en.json");

	it("ships more than one locale", () => {
		expect(localeFiles.length).toBeGreaterThan(1);
	});

	it.each(localeFiles.filter((file) => file !== "en.json"))("%s has exactly the keys en.json has", (file) => {
		const keys = keysOf(file);
		expect({
			missing: reference.filter((key) => !keys.includes(key)),
			extra: keys.filter((key) => !reference.includes(key)),
		}).toEqual({ missing: [], extra: [] });
	});

	const FORMAL_ADDRESS: Record<string, RegExp> = {
		"de.json": /\b(?:Sie|Ihr|Ihre|Ihrem|Ihren|Ihrer|Ihres|Ihnen)\b/,
		"fr.json": /\b(?:vous|votre|vos|veuillez)\b/i,
	};

	const FORMAL_ADDRESS_ALLOWED = new Set([
		"de.json cookiePolicy.sections.whatAreCookies.p1",
		"de.json legalNotice.sections.accessConditions.items.noIllegal",
		"fr.json faq.sections.security.data.question",
		"fr.json faq.sections.security.tracking.question",
	]);

	const entriesOf = (file: string) => {
		const out: Array<[string, string]> = [];
		interface WalkParams {
			value: unknown;
			path: string;
		}

		const walk = ({ value, path }: WalkParams) => {
			if (typeof value === "string") out.push([path, value]);
			else if (value && typeof value === "object")
				for (const [key, child] of Object.entries(value)) walk({ value: child, path: path ? `${path}.${key}` : key });
		};
		walk({ value: JSON.parse(read(`${LOCALES_DIR}/${file}`)), path: "" });
		return out;
	};

	it.each(Object.keys(FORMAL_ADDRESS))("%s addresses the user informally, like every other bundle", (file) => {
		const pattern = FORMAL_ADDRESS[file] as RegExp;
		const formal = entriesOf(file)
			.filter(([path, value]) => pattern.test(value) && !FORMAL_ADDRESS_ALLOWED.has(`${file} ${path}`))
			.map(([path, value]) => `${path} -> ${value}`);

		expect(formal).toEqual([]);
	});

	it("allows only formal-address hits that still exist and are still third person", () => {
		const stale = [...FORMAL_ADDRESS_ALLOWED].filter((entry) => {
			const [file = "", path = ""] = entry.split(" ");
			const pattern = FORMAL_ADDRESS[file];
			const found = entriesOf(file).find(([key]) => key === path);
			return !pattern || !found || !pattern.test(found[1]);
		});

		expect(stale).toEqual([]);
	});

	const UPPERCASE_RUN = /(?<![\p{L}\p{N}])\p{Lu}{2,}(?![\p{L}\p{N}])/gu;

	const ACRONYMS = new Set([
		"AEPD",
		"AI",
		"APDCAT",
		"API",
		"CDN",
		"CE",
		"CNIL",
		"DSGVO",
		"EE",
		"EEA",
		"EEE",
		"ES",
		"EU",
		"EUA",
		"EWR",
		"FAQ",
		"FR",
		"GDPR",
		"GPDP",
		"HH",
		"HR",
		"HTTPS",
		"IA",
		"ID",
		"IT",
		"KI",
		"LSSI",
		"NIF",
		"PDF",
		"PTO",
		"QA",
		"RGPD",
		"RH",
		"ROI",
		"RR",
		"RRHH",
		"RTT",
		"SEE",
		"TLS",
		"UE",
		"URL",
		"US",
		"USA",
		"UTC",
		"UU",
		"UX",
		"XOR",
	]);

	it.each(localeFiles)("%s shouts nothing an acronym does not explain", (file) => {
		const shouted = entriesOf(file)
			.flatMap(([path, value]) =>
				[...value.matchAll(UPPERCASE_RUN)]
					.map(([run]) => run)
					.filter((run) => !ACRONYMS.has(run))
					.map((run) => `${path} -> ${run}`),
			)
			.sort();

		expect([...new Set(shouted)]).toEqual([]);
	});

	it("keeps the acronym allow-list to names the bundles still use", () => {
		const used = new Set(
			localeFiles.flatMap((file) =>
				entriesOf(file).flatMap(([, value]) => [...value.matchAll(UPPERCASE_RUN)].map(([run]) => run)),
			),
		);

		expect([...ACRONYMS].filter((acronym) => !used.has(acronym))).toEqual([]);
	});
});
