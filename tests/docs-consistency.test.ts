import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import webNextConfig from "../apps/web/next.config";

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
const BACKTICKED_ALIAS = /`([^`.]+\/\*)`/g;
const CITED_PNPM_SCRIPT = /\bpnpm (?:run )?([a-z][a-z0-9:-]*)/g;
const CITED_FILTERED_PNPM_SCRIPT = /\bpnpm --filter (\S+) (?:run )?([a-z][a-z0-9:-]*)/g;
const WORKFLOW_SHELL_STEP = /^(\s*)-?[ \t]*(?:run|command):[ \t]*(\|[-+]?)?[ \t]*(.*)$/;
const ALIAS_WILDCARD_SUFFIX = /\/\*$/;
const WORKSPACE_PACKAGE_GLOB = /^\s*-\s*['"]?([^'"\s#]+)['"]?\s*$/gm;
const GITHUB_WORKFLOW_EXPRESSION = /\$\{\{\s*github\.workflow\s*\}\}/;

// Everything the repo would ship, staged or not, so a rule fires before the offending file is committed.
// Ignored paths and vendored tooling under dotfolders are excluded — they are not ours to fix.
// The index can lie — a stash cycle leaves deleted paths cached — so every entry is confirmed on disk.
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
const readIfPresent = (path: string) => (existsSync(join(ROOT, path)) ? read(path) : "");
const readJson = (path: string) => JSON.parse(read(path));

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
const scriptsByPackageName = new Map(
	WORKSPACE_PACKAGES.map((pkg) => {
		const manifest = readJson(`${pkg}/package.json`);
		return [manifest.name as string, (manifest.scripts ?? {}) as Record<string, string>];
	}),
);
const webTsconfig = readJson(`${WEB}/tsconfig.json`);
const webTsconfigOptions: Record<string, unknown> = webTsconfig.compilerOptions;
const webTsconfigExclude: string[] = webTsconfig.exclude ?? [];
const webTsconfigPaths: Record<string, string[]> = webTsconfigOptions.paths as Record<string, string[]>;

// The cross-package seam had three declarations of one string — the vite alias, `astro check`'s paths entry
// and two hardcoded copies down in this file — and nothing compared them. `apps/docs/tsconfig.json` is the
// declaration now; `astro.config.ts` derives the vite alias from it, and every rule below resolves through
// this one map rather than spelling `apps/web/src/ui` again.
const UI_ALIAS = "@ui/*";
const docsTsconfigPaths: Record<string, string[] | undefined> =
	readJson(`${DOCS}/tsconfig.json`).compilerOptions?.paths ?? {};
const UI_ROOT = join(ROOT, DOCS, (docsTsconfigPaths[UI_ALIAS]?.[0] ?? "").replace(ALIAS_WILDCARD_SUFFIX, ""));
const UI_ROOT_RELATIVE = relative(ROOT, UI_ROOT).replace(/\\/g, "/");
const resolveUiSpecifier = (specifier: string) => join(UI_ROOT, specifier.replace("@ui/", ""));

// A workflow is not markdown, so nothing above reaches it — and `.github/` sits under a dotfolder, which
// `trackedFiles` drops wholesale. The commands are read out of it by hand: the value when it is inline, and
// every line indented under it when it is a block scalar. `command:` counts as well as `run:` — every
// wrangler and OpenNext call in this repo is wrapped in `nick-fields/retry`, which takes its shell script on
// that input, so a rule reading only `run:` sees none of them.
const WORKFLOW_DIR = ".github/workflows";
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

const yamlBlock = (workflow: string, key: string) => {
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
const wranglerSection = (environment: string, table: string) =>
	webWrangler.filter((section) => section.path === (environment ? `${environment}.${table}` : table));
const wranglerBindingTables = (environment: string) =>
	new Set(WRANGLER_BINDING_TABLES.filter((table) => wranglerSection(environment, table).length > 0));
const wranglerBindings = (environment: string) => {
	const [vars] = wranglerSection(environment, "vars");
	const named = WRANGLER_NAMED_BINDING_TABLES.flatMap((table) => wranglerSection(environment, table))
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

	it("keeps the web tsconfig beside the next config it is rewritten by", () => {
		expect(existsSync(join(ROOT, WEB, "next.config.ts"))).toBe(true);
		expect(existsSync(join(ROOT, WEB, "tsconfig.json"))).toBe(true);
	});

	it("pins the same typescript in every manifest that declares one", () => {
		const declared = ["package.json", ...WORKSPACE_PACKAGES.map((pkg) => `${pkg}/package.json`)]
			.map((file) => [file, readJson(file).devDependencies?.typescript] as const)
			.filter(([, version]) => Boolean(version));

		expect(declared.length).toBe(3);
		expect(declared.filter(([, version]) => !EXACT_VERSION.test(version))).toEqual([]);
		expect(new Set(declared.map(([, version]) => version)).size).toBe(1);
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

	it("gives the payment rate limiter identical bounds in every environment", () => {
		const limiters = WRANGLER_ENVIRONMENTS.map((environment) =>
			wranglerSection(environment, "ratelimits").find((section) => section.entries.name === '"PAYMENT_RATE_LIMITER"'),
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

	// Absent from the tracked tree by design, yet the guides have to name it.
	const GENERATED = new Set([GENERATED_ENV_TYPES]);

	const exists = (token: string) => sourceFiles.some((path) => path === token || path.endsWith(`/${token}`));
	const citedSourceFiles = (files: string[]) => {
		const missing: string[] = [];
		for (const file of files) {
			for (const [, token] of read(file).matchAll(BACKTICKED_SOURCE_FILE)) {
				if (token.includes("*") || token.startsWith(".") || GENERATED.has(token)) continue;
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
	// The root guide forbids a nested CONTEXT.md outright — the name would mean two things, and the
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
	it("names only constants that exist somewhere in apps/web, in the published wiki", () => {
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
	// reported zero errors, and only `astro build` failed — in the Docs workflow, after the app's own CI
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

		// The scan used to stop at `${DOCS}/src/`, which left the two files that decide where the seam points
		// — `astro.config.ts` and `tsconfig.json` — outside it, along with `e2e/`. Markdown stays out on
		// purpose: a guide linking to an app file is a citation, not something the site builds from.
		const docsSources = trackedFiles.filter(
			(path) => path.startsWith(`${DOCS}/`) && !path.endsWith(".md") && !path.endsWith(".mdx"),
		);
		const reached = new Set<string>();

		// The old form required the segment after the `../` run to be literally `web/`, so an escape written
		// `../../apps/web/src/…` — the same reach, spelled from one directory deeper — matched nothing at all.
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

	// The seam was declared three times — the vite alias in `astro.config.ts`, the `paths` entry `astro check`
	// reads, and two hardcoded copies in this file — and nothing compared them, so a move under `apps/web`
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
	// `== 'true'` then never runs — silently, with a green tick, forever. `deploy-tail` shipped that way: the
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
	// runs a CLI the manifest does not pin. Renovate bumps the manifest — it is an npm devDependency — and
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

	// The rule above reads headings only, and the headings had already been fixed — the prose had not. The
	// glossary's own Bridge entry ended "a **bridge day** is one of the PTO days inside a bridge", and the
	// wiki's front page said "vacation days" twice, both under a canonical heading.
	//
	// Only the **multi-word** retired names are checked, and only those the glossary does not also declare
	// canonical somewhere. A blanket scan is unusable: the retired list holds `type`, `state`, `variant`,
	// `locale`, `filter`, `period` and `break`, which this wiki uses correctly as ordinary technical English
	// on 90 lines — the glossary retires them as names for a *domain concept*, not as words. A compound like
	// "bridge day" or "max working period" has no innocent reading here, so it needs no allowlist at all.
	// `holiday` and `free day` drop out on the canonical test, which is also what lets "public holiday"
	// through — the one phrasing CONTEXT.md blesses for English user-facing copy.
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
				const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "gi");
				for (const [match] of prose.matchAll(pattern)) offenders.push(`${file} -> ${match}`);
			}
		}

		expect(offenders).toEqual([]);
	});

	// IconsGalleryDemo says it is exhaustive, and a rename does break the build through import resolution —
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

	// TokenSwatch takes string[], so a renamed token renders `background: var(--gone)` — transparent, which
	// reads as a legitimate pale colour rather than an error. Nothing else checks these: astro check does not
	// see .mdx, and the citation rules match file paths.
	it("names only design tokens the stylesheets still declare", () => {
		const styles = trackedFiles
			.filter((path) => path.startsWith(`${WEB}/src/ui/styles/`) && path.endsWith(".css"))
			.map((path) => read(path))
			.join("\n");
		const fontVariables = [...read(`${WEB}/src/app/fonts.ts`).matchAll(/variable: ["'](--[\w-]+)["']/g)].map(
			([, token]) => token,
		);
		const declared = new Set([
			...[...styles.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(([, token]) => token),
			...fontVariables,
		]);

		const designSystemPages = contentFiles.filter((path) => path.includes("/design-system/"));
		const cited = new Set(
			designSystemPages.flatMap((path) => [...read(path).matchAll(/var\((--[\w-]+)\)/g)].map(([, token]) => token)),
		);

		expect(declared.size).toBeGreaterThan(20);
		expect([...cited].filter((token) => !declared.has(token))).toEqual([]);
	});

	it("prints repo-relative paths in the published wiki, never package-relative ones", () => {
		const ambiguous = /^(src|e2e|workers|public)\//;
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
	// grammar is not a regular language. Scanning alone is not enough either — only the parser knows whether a
	// slash opens a regex or divides, so a regex literal holding an escaped slash reads as a comment to a bare
	// scanner. Comments are trivia, so they hang off node boundaries rather than appearing in the tree.
	const commentsIn = (path: string, source: string) => {
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
			// has to be asked for as *trailing* — TypeScript only calls a comment leading when a line break comes
			// first, and here the brace does. This is the shape every a11y suppression on JSX takes.
			if (ts.isJsxExpression(node)) collect(ts.getTrailingCommentRanges(source, node.getStart() + 1));
			// `forEachChild` yields nodes but never punctuation tokens, so a comment sitting against a `{`, `}`,
			// `]` or `)` is trivia of nothing it reaches — the last line inside a block escaped entirely, which
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

			for (const { line, text } of commentsIn(file, source)) {
				if (!ALLOWED.test(text)) offenders.push(`${file}:${line}`);
			}
		}
		expect(offenders).toEqual([]);
	});
});

describe("directives sit where the compiler can see them", () => {
	// A directive is a bare string literal as the file's first statement. Wrap it in parentheses or let an
	// import sort above it and it silently becomes an ordinary expression: `'use client'` stops applying, the
	// module is treated as a Server Component, and nothing here notices. Typecheck passes, Biome passes, every
	// unit test passes — only `next build` fails, in CI, on a full production build. Six planner files spent
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

describe("the guides describe the project as it is configured", () => {
	// Backticked `foo/*` tokens are aliases; the dot filter drops the wrangler route pattern
	// `forever-pto.com/*`. Whole backticked tokens, not substrings: the rule this replaced stripped the
	// `/*` and searched the raw file, so `@app` matched inside `@application` and `src/*` reduced to `src`,
	// and either alias could be deleted from the guide with every assertion still green.
	const documentedAliases = new Set([...webGuide.matchAll(BACKTICKED_ALIAS)].map(([, alias]) => alias));
	const citedScripts = (guide: string) =>
		[...new Set([...guide.matchAll(CITED_PNPM_SCRIPT)].map(([, script]) => script))].filter(
			(script) => !NON_SCRIPT_PNPM.has(script),
		);

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
	it.each(workflowFiles)("%s runs only scripts a manifest declares", (file) => {
		const commands = runCommands(read(file));
		const available = { ...rootScripts, ...webScripts, ...docsScripts };
		expect(citedScripts(commands).filter((script) => !(script in available))).toEqual([]);
	});

	it.each(workflowFiles.map((file) => file.slice(WORKFLOW_DIR.length + 1)))(
		"%s is documented in both places that claim to list every workflow",
		(name) => {
			const rootGuide = read("CLAUDE.md");
			const wiki = read(`${DOCS}/src/content/docs/infra/workflows.mdx`);

			expect({ rootGuide: rootGuide.includes(name), wiki: wiki.includes(`## \`${name}\``) }).toEqual({
				rootGuide: true,
				wiki: true,
			});
		},
	);

	it("runs every wrangler deploy without a retry wrapper, so an argv error reports on the first attempt", () => {
		const wrapped: string[] = [];
		let deploySteps = 0;

		for (const file of workflowFiles) {
			for (const step of read(file).split("- name:")) {
				if (!step.includes("wrangler deploy")) continue;
				deploySteps += 1;
				if (step.includes("nick-fields/retry")) wrapped.push(`${file} ->${step.split(/\r?\n/)[0] ?? ""}`);
			}
		}

		expect(deploySteps).toBeGreaterThan(1);
		expect(wrapped).toEqual([]);
	});

	it("queues the development cleanup behind the CI run whose preview Worker it deletes", () => {
		const ci = read(`${WORKFLOW_DIR}/ci.yml`);
		const ciConcurrency = yamlBlock(ci, "concurrency");
		const cleanupConcurrency = yamlBlock(read(`${WORKFLOW_DIR}/cleanup-development.yml`), "concurrency");
		const workflowName = /^name:[ \t]*(.+)$/m.exec(ci)?.[1]?.trim() ?? "";

		expect(workflowName).not.toBe("");
		expect(ciConcurrency.group).toBeDefined();
		expect(cleanupConcurrency.group).toBe(
			(ciConcurrency.group ?? "").replace(GITHUB_WORKFLOW_EXPRESSION, workflowName),
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

		while (pending.length > 0) {
			const file = pending.pop() as string;
			if (!existsSync(join(ROOT, file))) continue;

			for (const [, specifier] of read(file).matchAll(/from\s+["'](\.[^"']+)["']/g)) {
				const target = join(dirname(file), specifier as string).replace(/\\/g, "/");
				const resolved = SOURCE_FILE.test(target) ? target : `${target}.ts`;
				if (reached.has(resolved)) continue;
				reached.add(resolved);
				pending.push(resolved);
			}
		}

		expect(filter).not.toBe("");
		expect(sources.length).toBeGreaterThan(0);
		expect([...reached].filter((path) => !path.startsWith(`${tailRoot}/`))).not.toEqual([]);
		expect([...reached].filter((path) => existsSync(join(ROOT, path)) && !pattern.test(path))).toEqual([]);
	});

	// The filtered form names its own package, so it can be checked wherever it is written — including the
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
			for (const [, pkg, script] of body.matchAll(CITED_FILTERED_PNPM_SCRIPT)) {
				if (NON_SCRIPT_PNPM.has(script as string)) continue;
				checked += 1;
				const scripts = scriptsByPackageName.get(pkg as string);
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

	it("declares no alias pointing at a directory that does not exist", () => {
		const dangling = Object.entries(webTsconfigPaths).filter(([, [target]]) => {
			const path = resolve(ROOT, WEB, (target ?? "").replace(ALIAS_WILDCARD_SUFFIX, ""));
			return !existsSync(path) || !statSync(path).isDirectory();
		});
		expect(dangling.map(([alias]) => alias)).toEqual([]);
	});

	// `next build` rewrites apps/web/tsconfig.json on every run and fills in its own defaults for any key
	// that is absent — `strict: false` and `allowJs: true`. Both would land at the next build rather than at
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
	const flatten = (value: unknown, path = "", out: string[] = []) => {
		if (value && typeof value === "object" && !Array.isArray(value)) {
			for (const [key, child] of Object.entries(value)) flatten(child, path ? `${path}.${key}` : key, out);
		} else out.push(path);
		return out;
	};
	const keysOf = (file: string) => flatten(JSON.parse(read(`${LOCALES_DIR}/${file}`))).sort();
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
		const walk = (value: unknown, path: string) => {
			if (typeof value === "string") out.push([path, value]);
			else if (value && typeof value === "object")
				for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key);
		};
		walk(JSON.parse(read(`${LOCALES_DIR}/${file}`)), "");
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
});
