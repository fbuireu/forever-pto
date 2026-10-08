import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import ts from "@typescript/typescript6";
import { describe, expect, it, vi } from "vitest";
import webNextConfig, { PUBLIC_ENV, RUNTIME_ONLY } from "../apps/web/next.config";
import { PAYMENT_STATUSES, PAYMENT_SUCCEEDED } from "../apps/web/src/domain/payment/events/types";
import { LOG_LEVEL } from "../apps/web/src/infrastructure/logging/contract";

const ROOT = resolve(__dirname, "..");
const WEB = "apps/web";
const DOCS = "apps/docs";
const WORKSPACE_PACKAGES = [WEB, DOCS];
const PACKAGE_GUIDES = WORKSPACE_PACKAGES.map((pkg) => `${pkg}/AGENTS.md`);
const LAYER_ROOTS = ["app", "application", "domain", "infrastructure", "ui"].map((layer) => `${WEB}/src/${layer}`);
const LOCALES_DIR = `${WEB}/src/ui/i18n/messages`;
const STARLIGHT_VENDOR = `${DOCS}/node_modules/@astrojs/starlight/dist`;
const ADR_DIR = "adr";
const ADR_TEMPLATE = "0000-adr-template.md";
const GENERATED_ENV_TYPES = "cloudflare-env.d.ts";
const HAND_WRITTEN_ENV_TYPES = "environment.d.ts";
const UNDECLARED_NAME = 2304;
const GENERATED_MARKDOWN = new Set([`${WEB}/CHANGELOG.md`]);

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
const PNPM_PACKAGE_FLAG = "(?:--filter|-F|--dir|-C)";
const PNPM_INVOCATION = new RegExp(
	String.raw`\bpnpm((?:\s+${PNPM_PACKAGE_FLAG}(?:\s+|=)\S+|\s+-{1,2}[\w-]+)*)\s+(?:run\s+)?([a-z][a-z0-9:-]*)`,
	"g",
);
const PNPM_INVOCATION_START = /\bpnpm\s+\S/g;
const CITED_PACKAGE_REF = new RegExp(String.raw`${PNPM_PACKAGE_FLAG}(?:\s+|=)(\S+)`);
const WORKFLOW_SHELL_STEP = /^(\s*)-?[ \t]*(?:run|command):[ \t]*(\|[-+]?)?[ \t]*(.*)$/;
const BUILD_TOOL_COMMAND = /\b(?:astro|next|opennextjs-cloudflare|vite|tsc|turbo) build\b/;
const BUILD_SCRIPT_NAME = /^(?:cf:)?build$/;
const DEPLOY_TOOL_COMMAND = /\b(?:wrangler|opennextjs-cloudflare) deploy\b/;
const SECRET_TOOL_COMMAND = /\bwrangler secret\b/;
const WRANGLER_ACTION_DEPLOY = /\bcommand:[ \t]*deploy\b/;
const ALIAS_WILDCARD_SUFFIX = /\/\*$/;
const WORKSPACE_PACKAGES_BLOCK = /^packages:\r?\n((?:[ \t]+-.*\r?\n?)+)/m;
const WORKSPACE_PACKAGE_GLOB = /^\s*-\s*['"]?([^'"\s#]+)['"]?\s*$/gm;
const GITHUB_WORKFLOW_EXPRESSION = /\$\{\{\s*github\.workflow\s*\}\}/;
const GITHUB_REF_EXPRESSION = /\$\{\{\s*github\.ref\s*\}\}/;
const PULL_REQUEST_MERGE_REF = `refs/pull/\${{ github.event.pull_request.number }}/merge`;
const AGGREGATE_NEEDS = /name: Check(?: \(docs\))?\n\s+needs: \[([^\]]+)\]\n\s+if: \$\{\{ always\(\) \}\}/;
const FONT_VARIABLE = /variable: ["'](--[\w-]+)["']/g;

const retiredTermPattern = (term: string) =>
	new RegExp(
		`\\b${term
			.split(/\s+/)
			.map((word) => `${escapeForRegExp(word)}s?`)
			.join("\\s+")}\\b`,
		"gi",
	);

const trackedFiles = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
	cwd: ROOT,
	encoding: "utf8",
})
	.split("\n")
	.filter((path) => path.length > 0 && !path.startsWith(".") && existsSync(join(ROOT, path)));

const markdownFiles = trackedFiles.filter((path) => path.endsWith(".md"));
const contentFiles = trackedFiles.filter((path) => path.endsWith(".mdx"));
const authoredMarkdown = markdownFiles.filter((path) => !GENERATED_MARKDOWN.has(path));
const GITHUB_DIR = ".github";
const githubMarkdown = readdirSync(join(ROOT, GITHUB_DIR))
	.filter((file) => file.endsWith(".md"))
	.map((file) => `${GITHUB_DIR}/${file}`);
const linkedMarkdown = [...authoredMarkdown, ...githubMarkdown];
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

const isGitIgnored = (path: string) => {
	try {
		execFileSync("git", ["check-ignore", "--no-index", "-q", "--", path], { cwd: ROOT });
		return true;
	} catch {
		return false;
	}
};

const rootGuide = read("AGENTS.md");
const webGuide = readIfPresent(`${WEB}/AGENTS.md`);
const rootManifest = readJson("package.json");
const rootScripts: Record<string, string> = rootManifest.scripts ?? {};
const webScripts: Record<string, string> = readJson(`${WEB}/package.json`).scripts ?? {};
const docsScripts: Record<string, string> = readJson(`${DOCS}/package.json`).scripts ?? {};
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

const UI_ALIAS = "@ui/*";
const docsTsconfigPaths: Record<string, string[] | undefined> =
	readJson(`${DOCS}/tsconfig.json`).compilerOptions?.paths ?? {};
const UI_ROOT = join(ROOT, DOCS, (docsTsconfigPaths[UI_ALIAS]?.[0] ?? "").replace(ALIAS_WILDCARD_SUFFIX, ""));
const UI_ROOT_RELATIVE = relative(ROOT, UI_ROOT).replace(/\\/g, "/");
const resolveUiSpecifier = (specifier: string) => join(UI_ROOT, specifier.replace("@ui/", ""));

const WEB_SRC = `${WEB}/src`;
const TEST_FILE = /\.test\.tsx?$/;
const IMPORT_SPECIFIER =
	/from\s*["']([^"']+)["']|import\s*\(\s*["'`]([^"'`]+)["'`]\s*\)|(?:^|\n)\s*import\s*["']([^"']+)["']|require\s*\(\s*["']([^"']+)["']\s*\)|vi\.mock\(\s*["']([^"']+)["']/g;

const aliasTargets = Object.entries(webTsconfigPaths).map(
	([alias, [target]]) =>
		[
			alias.replace(ALIAS_WILDCARD_SUFFIX, ""),
			`${WEB}/${(target ?? "").replace(ALIAS_WILDCARD_SUFFIX, "").replace(/^\.\//, "")}`,
		] as const,
);

const webProduction = sourceFiles.filter((path) => path.startsWith(`${WEB_SRC}/`) && !TEST_FILE.test(path));

const parsedSources = new Map<string, ts.SourceFile>();
const parse = (path: string): ts.SourceFile => {
	const cached = parsedSources.get(path);
	if (cached) return cached;
	const kind = path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
	const parsed = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, kind);
	parsedSources.set(path, parsed);
	return parsed;
};

interface ModuleImport {
	specifier: string;
	names: string[];
	namespace: boolean;
	typeOnly: boolean;
	dynamic: boolean;
}

const importsOf = (path: string): ModuleImport[] => {
	const found: ModuleImport[] = [];
	const visit = (node: ts.Node) => {
		if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
			const clause = node.importClause;
			const bindings = clause?.namedBindings;
			const named = bindings && ts.isNamedImports(bindings) ? [...bindings.elements] : [];
			const namespace = Boolean(bindings && ts.isNamespaceImport(bindings));
			const bindsValue = Boolean(clause?.name) || namespace || named.some((element) => !element.isTypeOnly);
			found.push({
				specifier: node.moduleSpecifier.text,
				names: named.map((element) => (element.propertyName ?? element.name).text),
				namespace,
				typeOnly: Boolean(clause?.isTypeOnly) || (clause !== undefined && !bindsValue),
				dynamic: false,
			});
		} else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
			found.push({
				specifier: node.moduleSpecifier.text,
				names: [],
				namespace: false,
				typeOnly: node.isTypeOnly,
				dynamic: false,
			});
		} else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
			const [argument] = node.arguments;
			if (argument && ts.isStringLiteralLike(argument))
				found.push({ specifier: argument.text, names: [], namespace: false, typeOnly: false, dynamic: true });
		}
		ts.forEachChild(node, visit);
	};
	visit(parse(path));
	return found;
};

interface ResolveSpecifierParams {
	from: string;
	specifier: string;
}

const resolveSpecifier = ({ from, specifier }: ResolveSpecifierParams): string => {
	if (specifier.startsWith(".")) return join(dirname(from), specifier).replace(/\\/g, "/");
	const alias = aliasTargets.find(([prefix]) => specifier === prefix || specifier.startsWith(`${prefix}/`));
	return alias ? `${alias[1]}${specifier.slice(alias[0].length)}` : "";
};

const WORKFLOW_DIR = ".github/workflows";
const COMPOSITE_ACTION_DIR = ".github/actions";
const REPINNED_RUNTIME = /^\s*(?:node-version|version|ruby-version|wranglerVersion):\s*["']?\d/m;
const VERSIONS_SECTION = /^## Versions$([\s\S]*?)^## /m;
const QUOTED_VERSION = /\d+\.\d+/;
const workflowFiles = readdirSync(join(ROOT, WORKFLOW_DIR))
	.filter((file) => file.endsWith(".yml"))
	.map((file) => `${WORKFLOW_DIR}/${file}`);
const compositeActionFiles = readdirSync(join(ROOT, COMPOSITE_ACTION_DIR)).map(
	(action) => `${COMPOSITE_ACTION_DIR}/${action}/action.yml`,
);

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

interface JobBodyParams {
	workflow: string;
	job: string;
}

const jobBody = ({ workflow, job }: JobBodyParams) => {
	const lines = workflow.split(/\r?\n/);
	const start = lines.indexOf(`  ${job}:`);
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

describe("the contract has a corpus to read", () => {
	it("reads every corpus its rules scan out of the tree at all", () => {
		expect(trackedFiles.length).toBeGreaterThan(500);
		expect(authoredMarkdown).toEqual(
			expect.arrayContaining(["AGENTS.md", "CODING_STANDARDS.md", "GLOSSARY.md", ...PACKAGE_GUIDES]),
		);
		expect(githubMarkdown).toEqual(
			expect.arrayContaining([`${GITHUB_DIR}/CONTRIBUTING.md`, `${GITHUB_DIR}/PULL_REQUEST_TEMPLATE.md`]),
		);
		expect(contentFiles.length).toBeGreaterThan(50);
		expect(sourceFiles.length).toBeGreaterThan(500);
		expect(workflowFiles.length).toBeGreaterThan(0);
	});
});

describe("GLOSSARY.md is the domain glossary and nothing else", () => {
	const glossary = read("GLOSSARY.md");

	it("lives only at the repo root", () => {
		expect(markdownFiles).toContain("GLOSSARY.md");
		expect(markdownFiles.filter((path) => path.endsWith("/GLOSSARY.md"))).toEqual([]);
	});

	it("is linked from AGENTS.md so it is discoverable", () => {
		expect(rootGuide).toContain("GLOSSARY.md");
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

	it("uses every term it defines in prose somewhere outside itself, since a term nothing else speaks is canonical in name only", () => {
		const elsewhere = authoredMarkdown
			.filter((path) => path !== "GLOSSARY.md")
			.concat(contentFiles)
			.map((path) => read(path))
			.join("\n");

		const defined = [...glossary.matchAll(GLOSSARY_TERM)].map(([, term]) => term);
		const unused = defined.filter((term) => !retiredTermPattern(term).test(elsewhere));

		expect(defined.length).toBeGreaterThan(20);
		expect(unused).toEqual([]);
	});

	it("never leaves an _Avoid_ list empty", () => {
		const avoidLines = [...glossary.matchAll(GLOSSARY_AVOID_LINE)];
		const empty = avoidLines.filter(([, list]) => list.trim().length === 0);

		expect(avoidLines.length).toBeGreaterThan(20);
		expect(empty).toEqual([]);
	});

	it("never lists a term as its own alternative", () => {
		const avoiding = [...glossary.matchAll(GLOSSARY_TERM_WITH_AVOID)];
		const selfAvoiding: string[] = [];
		for (const [, term, , avoided] of avoiding) {
			const alternatives = avoided.split(",").map((entry) => entry.trim().toLowerCase());
			if (alternatives.includes(term.toLowerCase())) selfAvoiding.push(term);
		}

		expect(avoiding.length).toBeGreaterThan(20);
		expect(selfAvoiding).toEqual([]);
	});
});

describe("the workspace is shaped the way the guides describe it", () => {
	const packagesBlock = read("pnpm-workspace.yaml").match(WORKSPACE_PACKAGES_BLOCK)?.[1] ?? "";
	const workspaceGlobs = [...packagesBlock.matchAll(WORKSPACE_PACKAGE_GLOB)].map(([, glob]) => glob);

	it("declares package globs that match a directory holding a manifest", () => {
		const dangling = workspaceGlobs.filter((glob) => {
			const [base] = glob.split("/*");
			return !existsSync(join(ROOT, base ?? "")) || !statSync(join(ROOT, base ?? "")).isDirectory();
		});

		expect(workspaceGlobs.length).toBeGreaterThan(0);
		expect(dangling).toEqual([]);
	});

	it.each(WORKSPACE_PACKAGES)("%s is a workspace member with its own manifest", (pkg) => {
		expect(existsSync(join(ROOT, pkg, "package.json"))).toBe(true);
		expect(workspaceGlobs.some((glob) => pkg.startsWith(glob.replace(/\*$/, "")))).toBe(true);
	});

	it.each(WORKSPACE_PACKAGES)("%s explains itself to a human and to an agent", (pkg) => {
		expect(existsSync(join(ROOT, pkg, "README.md"))).toBe(true);
		expect(existsSync(join(ROOT, pkg, "AGENTS.md"))).toBe(true);
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
		const excluded = includes
			.filter((entry) => entry.startsWith("!") && !entry.includes("*"))
			.map((entry) => entry.slice(1));

		expect(excluded.length).toBeGreaterThan(0);
		expect(excluded.filter((path) => !existsSync(join(ROOT, path)))).toEqual([]);
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

	it("strips every console call from the production build but the logger's levels, which carry its lines to the platform", async () => {
		const levels = Object.values(LOG_LEVEL).toSorted();
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("NEXT_PUBLIC_STORAGE_KEY", "contract-suite");
		vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_contract_suite");
		vi.resetModules();

		try {
			const { default: productionConfig } = await import("../apps/web/next.config");
			const stripped = productionConfig.compiler?.removeConsole;

			expect(typeof stripped === "object" ? stripped.exclude?.toSorted() : stripped).toEqual(levels);
		} finally {
			vi.unstubAllEnvs();
			vi.resetModules();
		}

		expect(webNextConfig.compiler?.removeConsole).toBe(false);
		expect(levels.length).toBeGreaterThan(0);
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

describe("pinned runtimes", () => {
	const manifest = readJson("package.json");
	const [packageManagerName, packageManagerVersion] = manifest.packageManager.split("@");

	it("names every runtime it pins", () => {
		const named = ["Node", "pnpm"].flatMap((runtime) =>
			["AGENTS.md", ".github/CONTRIBUTING.md"]
				.filter((doc) => !read(doc).includes(runtime))
				.map((doc) => `${doc}: ${runtime}`),
		);

		expect(named).toEqual([]);
	});

	it("quotes a version for none of them, since nothing here would keep one current", () => {
		const section = read("AGENTS.md").match(VERSIONS_SECTION)?.[1] ?? "";
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
		const candidates = [...workflowFiles, ...compositeActionFiles];
		const repinned = candidates.filter((file) => REPINNED_RUNTIME.test(read(file)));

		expect(candidates.length).toBeGreaterThan(workflowFiles.length);
		expect(repinned).toEqual([]);
	});
});

describe("the app's hashed build assets are cached for good", () => {
	it("marks /_next/static immutable, because Workers Static Assets revalidate every file by default", () => {
		const rules = read("apps/web/public/_headers").split(/\r?\n/);
		const start = rules.indexOf("/_next/static/*");

		expect(start).toBeGreaterThanOrEqual(0);
		expect(rules[start + 1]?.trim()).toBe("Cache-Control: public, max-age=31536000, immutable");
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
	const REQUIRED_CSP_DIRECTIVES = [
		"frame-ancestors 'none'",
		"object-src 'none'",
		"base-uri 'self'",
		"worker-src 'self' blob:",
	];
	const VENDOR_HOST_PAIRS = [
		["https://betterstack.net", "https://*.betterstackdata.com"],
		["https://www.googletagmanager.com", "https://*.google-analytics.com"],
		["https://static.cloudflareinsights.com", "https://cloudflareinsights.com"],
	];
	const HSTS_MINIMUM_MAX_AGE = 31536000;
	const FRAMING_REFUSALS = ["DENY", "SAMEORIGIN"];
	const sent = new Map(webHeaderRules.flatMap(({ headers }) => headers.map(({ key, value }) => [key, value])));

	it("matches every path, from exactly one rule", () => {
		expect(webHeaderRules.map(({ source }) => source)).toEqual(["/(.*)"]);
	});

	it("sends every header a browser cannot be told about later", () => {
		expect(REQUIRED_HEADERS.filter((header) => !sent.get(header))).toEqual([]);
	});

	it("states the CSP directives whose absence is invisible in a browser", () => {
		const directives = (sent.get("Content-Security-Policy") ?? "").split(";").map((directive) => directive.trim());
		expect(REQUIRED_CSP_DIRECTIVES.filter((directive) => !directives.includes(directive))).toEqual([]);
	});

	it.each(VENDOR_HOST_PAIRS)(
		"admits %s and the host it reports to, %s, or neither, since a refused beacon shows in the console alone",
		(from, to) => {
			const directives = (sent.get("Content-Security-Policy") ?? "").split(";").map((directive) => directive.trim());
			const directive = (name: string) => directives.find((entry) => entry.startsWith(`${name} `)) ?? "";

			expect(directive("script-src").includes(from)).toBe(directive("connect-src").includes(to));
		},
	);

	it("holds a browser to HTTPS for a year, subdomains included", () => {
		const hsts = sent.get("Strict-Transport-Security") ?? "";
		expect(Number(/max-age=(\d+)/.exec(hsts)?.[1] ?? 0)).toBeGreaterThanOrEqual(HSTS_MINIMUM_MAX_AGE);
		expect(hsts).toContain("includeSubDomains");
	});

	it("refuses framing and content sniffing outright", () => {
		expect(FRAMING_REFUSALS).toContain(sent.get("X-Frame-Options"));
		expect(sent.get("X-Content-Type-Options")).toBe("nosniff");
	});

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

	it.each(["assets", "placement"])("declares [%s] once, at the top level, and lets inheritance carry it", (table) => {
		expect(wranglerSection({ environment: "", table }).length).toBe(1);
		const restated = NAMED_WRANGLER_ENVIRONMENTS.filter(
			(environment) => wranglerSection({ environment, table }).length > 0,
		);
		expect(restated).toEqual([]);
	});

	const OBSERVABILITY_TABLES = ["observability", "observability.logs", "observability.traces"];
	const withoutDestinations = (entries: Record<string, string>) =>
		Object.fromEntries(Object.entries(entries).filter(([key]) => key !== "destinations"));
	const destinationsOf = (environment: string) =>
		OBSERVABILITY_TABLES.flatMap((table) =>
			wranglerSection({ environment, table })
				.map((section) => section.entries.destinations)
				.filter((value): value is string => Boolean(value)),
		);

	it("restates the same observability settings in every environment that restates them at all", () => {
		const blocks = WRANGLER_ENVIRONMENTS.map((environment) =>
			OBSERVABILITY_TABLES.map((table) =>
				wranglerSection({ environment, table }).map((section) => withoutDestinations(section.entries)),
			),
		);

		expect(blocks[0]?.flat().length).toBe(OBSERVABILITY_TABLES.length);
		expect(new Set(blocks.map((block) => JSON.stringify(block))).size).toBe(1);
	});

	it("ships each stage into its own export destinations, and the top level into production's, since nothing fails when two stages name the same one", () => {
		const development = destinationsOf("env.development");
		const production = destinationsOf("env.production");

		expect(WRANGLER_ENVIRONMENTS.filter((environment) => destinationsOf(environment).length === 0)).toEqual([]);
		expect(development.filter((destination) => production.includes(destination))).toEqual([]);
		expect(destinationsOf("")).toEqual(production);
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
	const nestedGuides = markdownFiles.filter((path) => path !== "AGENTS.md" && path.endsWith("AGENTS.md"));
	const webSrcGuides = nestedGuides.filter((path) => path.startsWith(`${WEB}/src/`));

	it.each(LAYER_ROOTS)("%s has an AGENTS.md", (layer) => {
		expect(existsSync(join(ROOT, layer, "AGENTS.md"))).toBe(true);
	});

	it.each(PACKAGE_GUIDES)("%s exists", (guide) => {
		expect(existsSync(join(ROOT, guide))).toBe(true);
	});

	it("lists every package guide in the root AGENTS.md", () => {
		expect(PACKAGE_GUIDES.filter((guide) => !rootGuide.includes(`./${guide}`))).toEqual([]);
	});

	it("lists every web source guide in the apps/web AGENTS.md table", () => {
		expect(webSrcGuides.length).toBeGreaterThan(LAYER_ROOTS.length);
		const missing = webSrcGuides.filter((path) => !webGuide.includes(`./${path.slice(`${WEB}/`.length)}`));
		expect(missing).toEqual([]);
	});

	it("titles every nested guide with its own folder path, then a body", () => {
		const malformed = nestedGuides.filter((path) => {
			const [heading, , body] = read(path).split("\n");
			return heading !== `# ${dirname(path)}` || !body?.trim();
		});

		expect(nestedGuides.length).toBeGreaterThan(LAYER_ROOTS.length);
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

		expect(numbers.length).toBeGreaterThan(0);
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

	it("are each linked from a document outside adr/", () => {
		const elsewhere = authoredMarkdown.filter((path) => !path.startsWith(`${ADR_DIR}/`)).map(read);
		const orphaned = decisions.filter((file) => !elsewhere.some((body) => body.includes(file)));

		expect(decisions.length).toBeGreaterThan(0);
		expect(orphaned).toEqual([]);
	});

	it("name back every document outside adr/ that ties an amendment to them, so an amendment is reachable from the ADR it changes", () => {
		const byNumber = new Map(decisions.map((file) => [file.slice(0, 4), read(`${ADR_DIR}/${file}`)]));
		const unrecorded: string[] = [];
		let checked = 0;

		for (const file of authoredMarkdown.filter((path) => !path.startsWith(`${ADR_DIR}/`))) {
			const body = read(file);
			for (const claim of body.matchAll(AMENDMENT_WORD)) {
				const at = claim.index ?? 0;
				const window = body.slice(Math.max(0, at - AMENDMENT_PROXIMITY), at + AMENDMENT_PROXIMITY);
				for (const [, fromLink, fromProse] of window.matchAll(ADR_REFERENCE)) {
					const number = fromLink ?? fromProse;
					const adr = number ? byNumber.get(number) : undefined;
					if (!adr) continue;
					checked += 1;
					if (!adr.includes(file)) unrecorded.push(`${file} amends ADR ${number}, which never names ${file}`);
				}
			}
		}

		expect(checked).toBeGreaterThan(0);
		expect([...new Set(unrecorded)]).toEqual([]);
	});
});

describe("documentation does not point at things that are gone", () => {
	const IGNORED_LINK = /^(https?:|mailto:|#|webcal:)/;

	it("resolves every relative markdown link, the contributing guide and the pull request template included", () => {
		const broken: string[] = [];
		let checked = 0;
		for (const file of linkedMarkdown) {
			for (const [, , target] of read(file).matchAll(MARKDOWN_LINK)) {
				if (IGNORED_LINK.test(target)) continue;
				const [path] = target.split("#");
				if (!path) continue;
				checked += 1;
				if (!existsSync(resolve(ROOT, dirname(file), path))) broken.push(`${file} -> ${target}`);
			}
		}

		expect(checked).toBeGreaterThan(100);
		expect(broken).toEqual([]);
	});

	it("keeps a table row that names a package from linking the root twin of that package's own file", () => {
		const mistargeted: string[] = [];
		let checked = 0;

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
					checked += 1;

					const resolved = relative(ROOT, resolve(ROOT, dirname(file), path)).replace(/\\/g, "/");
					if (resolved === named || resolved.startsWith(`${named}/`)) continue;
					if (!existsSync(join(ROOT, named, basename(resolved)))) continue;

					mistargeted.push(`${file} -> row about ${named} links ${target}, but ${named}/${basename(resolved)} exists`);
				}
			}
		}

		expect(checked).toBeGreaterThan(0);
		expect(mistargeted).toEqual([]);
	});

	const GENERATED = new Set([GENERATED_ENV_TYPES]);

	const DELIBERATELY_ABSENT = new Set(["proxy.ts", "index.ts"]);

	const isSupersededAdr = (file: string) =>
		file.startsWith("adr/") && /^## Status\n\n(?:.*\n)*?Superseded by /m.test(read(file));

	const exists = (token: string) => sourceFiles.some((path) => path === token || path.endsWith(`/${token}`));

	interface SourceFileCitations {
		missing: string[];
		checked: number;
	}

	const citedSourceFiles = (files: string[]): SourceFileCitations => {
		const missing: string[] = [];
		let checked = 0;
		for (const file of files) {
			if (isSupersededAdr(file)) continue;
			for (const [, token] of read(file).matchAll(BACKTICKED_SOURCE_FILE)) {
				if (token.includes("*") || token.startsWith(".") || GENERATED.has(token) || DELIBERATELY_ABSENT.has(token))
					continue;
				checked += 1;
				if (!exists(token)) missing.push(`${file} -> ${token}`);
			}
		}
		return { missing, checked };
	};

	it("names only source files that still exist somewhere", () => {
		const { missing, checked } = citedSourceFiles(authoredMarkdown);

		expect(checked).toBeGreaterThan(100);
		expect(missing).toEqual([]);
	});

	it("names only source files that still exist, in the published wiki too", () => {
		const { missing, checked } = citedSourceFiles(contentFiles);

		expect(contentFiles.length).toBeGreaterThan(50);
		expect(checked).toBeGreaterThan(100);
		expect(missing).toEqual([]);
	});

	it("never teaches a nested GLOSSARY.md, which the root guide forbids", () => {
		const offenders: string[] = [];
		for (const file of [...authoredMarkdown, ...contentFiles]) {
			for (const [, token] of read(file).matchAll(NESTED_CONTEXT_CITATION)) {
				offenders.push(`${file} -> ${token}`);
			}
		}
		expect(offenders).toEqual([]);
	});

	it("names only constants that exist somewhere in apps/web, in the published wiki's prose", () => {
		const SCREAMING_SNAKE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;
		const CONSTANT_NAME = /[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+/g;

		const CONFIGURATION = [
			`${WEB}/environment.d.ts`,
			`${WEB}/wrangler.toml`,
			`${WEB}/.env.example`,
			`${WEB}/playwright.config.ts`,
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

	it("resolves every @ui specifier the docs sources import to a file that exists, since astro check reports none that points at nothing", () => {
		const UI_SPECIFIER = /from\s*['"](@ui\/[^'"]+)['"]/g;
		const dangling: string[] = [];
		let checked = 0;

		for (const file of trackedFiles.filter((path) => path.startsWith(`${DOCS}/src/`))) {
			for (const [, specifier] of read(file).matchAll(UI_SPECIFIER)) {
				checked += 1;
				const base = resolveUiSpecifier(specifier);
				const resolved = [`${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`, base].some(
					(candidate) => existsSync(candidate),
				);
				if (!resolved) dangling.push(`${file} -> ${specifier}`);
			}
		}

		expect(checked).toBeGreaterThan(50);
		expect(dangling).toEqual([]);
	});

	it("resolves every relative @import and @source the docs stylesheets reach for", () => {
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

	it("triggers the docs workflow on every apps/web path the docs site reaches into", () => {
		const workflow = read(".github/workflows/docs.yml");
		const filter = /DOCS_PATHS: '\^\(([^']+)\)'/.exec(workflow)?.[1] ?? "";
		const watched = filter
			.split("|")
			.map((pattern) => pattern.replace(/\$$/, "").replace(/\\\./g, ".").replace(/\/$/, ""))
			.filter((path) => path.startsWith("apps/web"))
			.map((path) => path.replace(SOURCE_FILE, ""));

		expect(filter).not.toBe("");

		const docsSources = trackedFiles.filter(
			(path) => path.startsWith(`${DOCS}/`) && !path.endsWith(".md") && !path.endsWith(".mdx"),
		);
		const reached = new Set<string>();

		const RELATIVE_ESCAPE = /['"(]((?:\.\.\/)+(?:apps\/)?web\/[^'")]+)['")]/g;
		const JOINED_ESCAPE = /\bjoin\(\s*(?:import\.meta\.dirname|__dirname)((?:\s*,\s*["'][^"']*["'])+)/g;
		const JOINED_SEGMENT = /["']([^"']*)["']/g;

		for (const file of docsSources) {
			const source = read(file);
			for (const [, specifier] of source.matchAll(/from\s+["']@ui\/([^"']+)["']/g)) {
				reached.add(`${UI_ROOT_RELATIVE}/${specifier}`);
			}
			for (const [, specifier] of source.matchAll(RELATIVE_ESCAPE)) {
				reached.add(join(dirname(file), specifier).replace(/\\/g, "/"));
			}
			for (const [, segments = ""] of source.matchAll(JOINED_ESCAPE)) {
				const parts = [...segments.matchAll(JOINED_SEGMENT)].map(([, segment]) => segment);
				const joined = join(dirname(file), ...parts).replace(/\\/g, "/");
				if (joined.startsWith(`${WEB}/`)) reached.add(joined);
			}
		}

		expect(reached.size).toBeGreaterThan(10);

		const unwatched = [...reached].filter((path) => !watched.some((prefix) => path.startsWith(prefix)));
		expect(unwatched).toEqual([]);
	});

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

	it("writes every output the changes job declares, on both paths through its Filter step, since an output nobody writes is the empty string and the job gated on it never runs", () => {
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

		const missingFromMainPath = declared.filter((name) => !mainPath?.includes(`echo '${name}=`));
		expect(missingFromMainPath, "never written on the normal path, so it stays empty on every real run").toEqual([]);
	});

	it("hands wrangler-action the wrangler the docs manifest pins, read from the manifest rather than written twice", () => {
		const workflow = read(".github/workflows/docs.yml");
		const inputs = workflow.match(/^\s+wranglerVersion: .+$/gm) ?? [];
		const derived = workflow.match(/^\s+wranglerVersion: \$\{\{ steps\.wrangler\.outputs\.version \}\}$/gm) ?? [];
		const readers =
			workflow.match(/^\s+id: wrangler\n\s+run: .*apps\/docs\/package\.json.*devDependencies\.wrangler.*$/gm) ?? [];

		expect(inputs.length).toBeGreaterThan(0);
		expect(derived.length).toBe(inputs.length);
		expect(readers.length).toBe(inputs.length);
	});

	it("heads the published glossary with canonical terms, never retired ones", () => {
		const glossary = read("GLOSSARY.md");
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

	it("writes the canonical name in the published wiki's prose outside the landing pages marketing owns, not a multi-word retired one, since single retired words such as type and state are ordinary English there", () => {
		const glossary = read("GLOSSARY.md");
		const canonical = new Set([...glossary.matchAll(GLOSSARY_TERM)].map(([, term]) => term.toLowerCase()));
		const compounds = [
			...new Set(
				[...glossary.matchAll(GLOSSARY_AVOID_LINE)].flatMap(([, list]) =>
					list.split(",").map((entry) => entry.trim().toLowerCase()),
				),
			),
		].filter((term) => term.includes(" ") && !canonical.has(term));

		expect(compounds.length).toBeGreaterThan(10);

		const landingPages = contentFiles.filter((file) =>
			/^template: splash$/m.test(read(file).match(/^---\n[\s\S]*?\n---\n/)?.[0] ?? ""),
		);
		expect(landingPages.length).toBeGreaterThan(0);
		expect(landingPages.every((file) => file.endsWith("/index.mdx"))).toBe(true);

		const offenders: string[] = [];
		for (const file of contentFiles.filter((path) => !landingPages.includes(path))) {
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

	it("shows every animated icon in the published gallery, since an added icon module breaks no build", () => {
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

	it("names only design tokens the stylesheets still declare, since a swatch of a missing token renders transparent instead of failing", () => {
		const stylesheets = trackedFiles.filter(
			(path) =>
				path.endsWith(".css") && (path.startsWith(`${WEB}/src/ui/styles/`) || path.startsWith(`${DOCS}/src/styles/`)),
		);
		const fontVariables = [...read(`${WEB}/src/app/fonts.ts`).matchAll(FONT_VARIABLE)].map(([, token]) => token);
		const declared = new Set([
			...stylesheets.flatMap((path) => [...read(path).matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(([, token]) => token)),
			...fontVariables,
		]);

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

	it("overrides only the Starlight strings the docs site actually changes", async () => {
		const overrides = trackedFiles.filter(
			(path) => path.startsWith(`${DOCS}/src/content/i18n/`) && path.endsWith(".json"),
		);
		const restated: string[] = [];
		let checked = 0;

		expect(overrides.length).toBeGreaterThan(0);

		for (const file of overrides) {
			const vendor = `${STARLIGHT_VENDOR}/translations/${basename(file, ".json")}.js`;
			expect(existsSync(join(ROOT, vendor)), `${vendor} is absent, so this rule would read nothing`).toBe(true);

			const defaults: Record<string, string> = (await import(pathToFileURL(join(ROOT, vendor)).href)).default;
			for (const [key, value] of Object.entries(readJson(file) as Record<string, string>)) {
				checked += 1;
				if (defaults[key] === value) restated.push(`${file} -> ${key} restates the Starlight default`);
			}
		}

		expect(checked).toBeGreaterThan(0);
		expect(restated).toEqual([]);
	});

	it("overrides search.ctrlKey with a modifier alone, because Starlight renders the K itself", () => {
		const SEARCH_SHORTCUT = /<kbd>\{[^}]*search\.ctrlKey[^}]*\}<\/kbd><kbd>K<\/kbd>/;
		const MODIFIER_ALONE = /^\S{1,5}$/;
		const search = `${STARLIGHT_VENDOR}/components/Search.astro`;

		expect(existsSync(join(ROOT, search)), `${search} is absent, so this rule would read nothing`).toBe(true);
		expect(SEARCH_SHORTCUT.test(read(search))).toBe(true);

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
		const ambiguous = /^(src|e2e|workers|public)\//;
		const offenders: string[] = [];
		let checked = 0;
		for (const file of contentFiles) {
			for (const [, token] of read(file).matchAll(BACKTICKED_TOKEN)) {
				checked += 1;
				if (ambiguous.test(token)) offenders.push(`${file} -> ${token}`);
			}
		}

		expect(checked).toBeGreaterThan(100);
		expect(offenders).toEqual([]);
	});

	const FENCED_BLOCK = /```[\s\S]*?```/g;
	const CODE_SPAN = /`[^`\n]*`/g;
	const QUOTED_PHRASE = /"[^"\n]*"|“[^”\n]*”/g;
	const HISTORY_MARKERS: Record<string, RegExp> = {
		"used to": /(?<=\w\s+)(?<!\b(?:is|are|was|were|be|been|being|get|gets|got|and|or)\s+)\bused\s+to\b/gi,
		"no longer": /\bno\s+longer\b(?!\s+exists?\b)/gi,
		"any more": /\banymore\b|\bany\s+more(?=\s*[.,;:)])/gi,
		previously: /\bpreviously\b/gi,
		formerly: /\bformerly\b/gi,
		"until now": /\buntil\s+(?:now|this\s+(?:page|section|change|commit|release|fix|job|rule|entry))\b/gi,
		"a dated event": /\b20\d\d-\d\d-\d\d\b/g,
		"was … until": /\b(?:was|were)\b[^.;:!?]{0,100}?\buntil\b/gi,
		"a change narrated":
			/\b(?:was|were|has\s+been|have\s+been)\s+(?:weighed|tried|rejected|rewritten|reverted|retired|superseded|dropped|replaced|renamed)\b/gi,
	};

	const proseOf = (source: string) =>
		[FENCED_BLOCK, CODE_SPAN, QUOTED_PHRASE].reduce(
			(text, pattern) => text.replace(pattern, (span) => span.replace(/[^\n]/g, " ")),
			source,
		);

	const historyIn = (source: string) => {
		const prose = proseOf(source);

		return Object.entries(HISTORY_MARKERS).flatMap(([marker, pattern]) =>
			[...prose.matchAll(pattern)].map((match) => ({
				marker,
				line: source.slice(0, match.index).split("\n").length,
				excerpt: source.slice(match.index, match.index + 60).replace(/\s+/g, " "),
			})),
		);
	};

	it("tells no history in the prose of a published page, which states the present while git keeps the past", () => {
		const offenders = contentFiles.flatMap((file) =>
			historyIn(read(file)).map(({ line, marker, excerpt }) => `${file}:${line} ${marker}: ${excerpt}`),
		);
		const scanned = contentFiles.reduce((total, file) => total + proseOf(read(file)).replace(/\s/g, "").length, 0);

		expect(contentFiles.length).toBeGreaterThan(50);
		expect(scanned).toBeGreaterThan(150000);
		expect(offenders).toEqual([]);
	});

	it("reads every history marker in prose, and none in a code span, a fence, a quotation or a participle", () => {
		const TELLS_HISTORY: Record<string, string[]> = {
			"used to": ["It used to centre on phones.", "the list\nused to be a filter", "values that used to be cached"],
			"no longer": ["so the type no longer has to compensate", "No longer reachable."],
			"any more": ["It does not exist any more: the platform", "not anymore.", "are not any\nmore, they"],
			previously: ["where it previously could not"],
			formerly: ["formerly a tail Worker"],
			"until now": ["undocumented until this page was corrected", "until now the recovery"],
			"a dated event": ["so on 2026-08-29 they reverted", "(2026-09-12)"],
			"was … until": ["The flag was on, with sites, until it was found", "they were,\nuntil both packages"],
			"a change narrated": ["that was weighed and rejected", "has been replaced by", "was tried and"],
		};
		const TELLS_NONE = [
			"a code, used to pre-select the calendar",
			"Used to pre-select the calendar",
			"| `user-country` | Detected code, used to pre-select | no |",
			"the helper is used to build the key",
			"it was built and used to sign it",
			"`it used to be` in a code span",
			"```\nno longer\nformerly\n```",
			'the phrase "previously" quoted',
			"the phrase “no longer” quoted",
			"a Worker that no longer exists",
			"any more specific rule",
			"until the visitor consents, or until then",
			"on 1 May",
			"why it was chosen",
		];
		const markersIn = (source: string) => historyIn(source).map(({ marker }) => marker);

		const missed = Object.entries(TELLS_HISTORY).flatMap(([marker, samples]) =>
			samples.filter((sample) => !markersIn(sample).includes(marker)).map((sample) => `${marker}: ${sample}`),
		);

		expect(Object.keys(TELLS_HISTORY).sort()).toEqual(Object.keys(HISTORY_MARKERS).sort());
		expect(missed).toEqual([]);
		expect(TELLS_NONE.filter((sample) => historyIn(sample).length > 0)).toEqual([]);
	});
});

interface Comment {
	at: number;
	text: string;
}

interface ScriptCommentsParams {
	source: string;
	kind: ts.ScriptKind;
}

const scriptComments = ({ source, kind }: ScriptCommentsParams): Comment[] => {
	const parsed = ts.createSourceFile("scanned", source, ts.ScriptTarget.Latest, true, kind);
	const found = new Map<number, string>();

	const visit = (node: ts.Node): void => {
		if (node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode) return;

		const children = node.getChildren(parsed);

		if (children.length === 0) {
			const start = node.getStart(parsed);
			const trivia = [
				...(ts.getTrailingCommentRanges(source, node.getFullStart()) ?? []),
				...(ts.getLeadingCommentRanges(source, node.getFullStart()) ?? []),
			];

			for (const { pos, end } of trivia) if (end <= start) found.set(pos, source.slice(pos, end));
		}

		for (const child of children) visit(child);
	};

	visit(parsed);

	return [...found].map(([at, text]) => ({ at, text }));
};

const CSS_TOKEN = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|\/\*[\s\S]*?\*\//g;

const cssComments = (source: string): Comment[] =>
	[...source.matchAll(CSS_TOKEN)].flatMap((match) =>
		match[0].startsWith("/*") ? [{ at: match.index ?? 0, text: match[0] }] : [],
	);

const ASTRO_FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const ASTRO_SCRIPT = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
const ASTRO_STYLE = /<style\b[^>]*>([\s\S]*?)<\/style>/g;
const MARKUP_COMMENT = /<!--[\s\S]*?-->|\{\s*\/\*[\s\S]*?\*\/\s*\}/g;

interface EmbeddedCommentsParams {
	source: string;
	pattern: RegExp;
	scan: (body: string) => Comment[];
}

const embeddedComments = ({ source, pattern, scan }: EmbeddedCommentsParams): Comment[] =>
	[...source.matchAll(pattern)].flatMap((match) => {
		const offset = (match.index ?? 0) + match[0].indexOf(">") + 1;

		return scan(match[1] ?? "").map(({ at, text }) => ({ at: offset + at, text }));
	});

const astroComments = (source: string): Comment[] => {
	const frontmatter = ASTRO_FRONTMATTER.exec(source);

	return [
		...(frontmatter
			? scriptComments({ source: frontmatter[1] ?? "", kind: ts.ScriptKind.TS }).map(({ at, text }) => ({
					at: frontmatter[0].indexOf("\n") + 1 + at,
					text,
				}))
			: []),
		...embeddedComments({
			source,
			pattern: ASTRO_SCRIPT,
			scan: (body) => scriptComments({ source: body, kind: ts.ScriptKind.TS }),
		}),
		...embeddedComments({ source, pattern: ASTRO_STYLE, scan: cssComments }),
		...[...source.matchAll(MARKUP_COMMENT)].map((match) => ({ at: match.index ?? 0, text: match[0] })),
	];
};

interface HashCommentsParams {
	source: string;
	multilineStrings: boolean;
}

const hashComments = ({ source, multilineStrings }: HashCommentsParams): Comment[] => {
	const found: Comment[] = [];
	let quote = "";
	let at = 0;

	while (at < source.length) {
		const char = source[at] ?? "";

		if (char === "\n" && !multilineStrings) quote = "";

		if (quote) {
			if (char === "\\" && quote === '"') at += 1;
			else if (char === quote) quote = "";
		} else if (char === '"' || char === "'") quote = char;
		else if (char === "#" && (at === 0 || /\s/.test(source[at - 1] ?? ""))) {
			const newline = source.indexOf("\n", at);
			const end = newline === -1 ? source.length : newline;

			found.push({ at, text: source.slice(at, end).trimEnd() });
			at = end;
			continue;
		}

		at += 1;
	}

	return found;
};

const SCRIPT_FILE = /\.(?:[cm]?[jt]sx?|json)$/;
const STYLESHEET_FILE = /\.css$/;
const ASTRO_FILE = /\.astro$/;
const HASH_COMMENTED_FILE = /(?:\.toml|\.env\.example|\/_headers)$/;
const HUSKY_DIR = ".husky";
const DOTFILE_CONFIGS = [".github/renovate.json", ".lintstagedrc.json"];
const SOURCE_DIRECTIVE =
	/^(?:\/\/\/\s*<reference\b|\/\/\s*(?:biome-ignore|@ts-expect-error|@vitest-environment)\b|\/\*\s*biome-ignore\b)/;
const GENERATED_BANNER =
	/^\/\/\s*(?:Auto-generated by\b|NOTE: This file should not be edited$|see https:\/\/nextjs\.org\/docs\/app\/api-reference\/config\/typescript for more information\.$)/;

interface CommentsInParams {
	file: string;
	source: string;
}

const isShebang = ({ at, text }: Comment) => at === 0 && text.startsWith("#!");

const scriptKindOf = (file: string) => {
	if (file.endsWith(".tsx") || file.endsWith(".jsx")) return ts.ScriptKind.TSX;
	if (file.endsWith(".json")) return ts.ScriptKind.JSON;
	return /\.[cm]?js$/.test(file) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
};

const commentsIn = ({ file, source }: CommentsInParams): Comment[] => {
	const found = (() => {
		if (ASTRO_FILE.test(file)) return astroComments(source);
		if (STYLESHEET_FILE.test(file)) return cssComments(source);
		if (file.startsWith(`${HUSKY_DIR}/`)) return hashComments({ source, multilineStrings: true });
		if (HASH_COMMENTED_FILE.test(file)) return hashComments({ source, multilineStrings: false });
		if (!source.includes("//") && !source.includes("/*")) return [];

		return scriptComments({ source, kind: scriptKindOf(file) });
	})();

	return found.sort((a, b) => a.at - b.at);
};

interface LineAtParams {
	source: string;
	at: number;
}

const lineAt = ({ source, at }: LineAtParams) => source.slice(0, at).split("\n").length;

describe("the hand-written source carries no explanatory comments", () => {
	const huskyHooks = readdirSync(join(ROOT, HUSKY_DIR), { withFileTypes: true })
		.filter((entry) => entry.isFile())
		.map((entry) => `${HUSKY_DIR}/${entry.name}`);
	const commentedFiles = [
		...trackedFiles.filter(
			(path) =>
				SCRIPT_FILE.test(path) || STYLESHEET_FILE.test(path) || ASTRO_FILE.test(path) || HASH_COMMENTED_FILE.test(path),
		),
		...huskyHooks,
		...DOTFILE_CONFIGS.filter((path) => existsSync(join(ROOT, path))),
	];
	const areas: Record<string, string[]> = {
		"the contract suite": commentedFiles.filter((path) => path.startsWith("tests/") && SCRIPT_FILE.test(path)),
		"the app's TypeScript": commentedFiles.filter((path) => path.startsWith(`${WEB}/src/`) && SCRIPT_FILE.test(path)),
		"the app's e2e specs and configs": commentedFiles.filter(
			(path) => path.startsWith(`${WEB}/`) && !path.startsWith(`${WEB}/src/`) && SCRIPT_FILE.test(path),
		),
		"the app's stylesheets": commentedFiles.filter(
			(path) => path.startsWith(`${WEB}/src/`) && STYLESHEET_FILE.test(path),
		),
		"the docs site's TypeScript": commentedFiles.filter(
			(path) => path.startsWith(`${DOCS}/`) && SCRIPT_FILE.test(path),
		),
		"the docs site's Astro components": commentedFiles.filter((path) => ASTRO_FILE.test(path)),
		"the docs site's stylesheet": commentedFiles.filter(
			(path) => path.startsWith(`${DOCS}/`) && STYLESHEET_FILE.test(path),
		),
		"the root configs": commentedFiles.filter((path) => !path.includes("/") && SCRIPT_FILE.test(path)),
		"the Worker configs, env examples and headers": commentedFiles.filter((path) => HASH_COMMENTED_FILE.test(path)),
		"the Husky hooks": huskyHooks,
		"the configs under a dotfile name": commentedFiles.filter((path) => DOTFILE_CONFIGS.includes(path)),
	};

	it("has hand-written sources of every kind to check", () => {
		expect(
			Object.entries(areas)
				.filter(([, files]) => files.length === 0)
				.map(([area]) => area),
		).toEqual([]);
		expect(areas["the contract suite"]).toContain("tests/docs-consistency.test.ts");
		expect(areas["the app's TypeScript"].length).toBeGreaterThan(100);
	});

	it("reads each kind of source for its comments and mistakes no string, URL or regex for one", () => {
		const spoken = (sample: CommentsInParams) => commentsIn(sample).map(({ text }) => text);

		expect(spoken({ file: "a.ts", source: 'const url = "https://a.b"; const slash = /\\/\\//; // said' })).toEqual([
			"// said",
		]);
		expect(
			spoken({ file: "a.ts", source: "const open = { a: 1, /* said */ };\nconst last = [1, // said\n];" }),
		).toEqual(["/* said */", "// said"]);
		expect(spoken({ file: "a.tsx", source: 'const link = <a href="https://a.b">//text, not a comment</a>;' })).toEqual(
			[],
		);
		expect(spoken({ file: "a.tsx", source: "const node = <p>{/* said */}</p>;" })).toEqual(["/* said */"]);
		expect(spoken({ file: "a.ts", source: "/** said */\nexport const a = 1;" })).toEqual(["/** said */"]);
		expect(spoken({ file: "a.json", source: '{ "url": "https://a.b", /* said */ "a": 1 }' })).toEqual(["/* said */"]);
		expect(spoken({ file: "a.css", source: '.a { content: "/* not */"; } /* said */' })).toEqual(["/* said */"]);
		expect(
			spoken({
				file: "a.astro",
				source:
					"---\nconst a = 1; // said\n---\n<p>a</p><!-- said -->\n<script>// said\n</script>\n<style>.a { color: red; } /* said */</style>",
			}),
		).toEqual(["// said", "<!-- said -->", "// said", "/* said */"]);
		expect(spoken({ file: "a.toml", source: 'a = "x # not" # said\n# said\nb = [1]' })).toEqual(["# said", "# said"]);
		expect(spoken({ file: ".husky/a", source: 'echo "a\n# not" $# # said' })).toEqual(["# said"]);
		expect(lineAt({ source: "a\nb\nc", at: 4 })).toBe(3);
		expect(SOURCE_DIRECTIVE.test("// biome-ignore lint/style/noArguments: the vendor reads them")).toBe(true);
		expect(SOURCE_DIRECTIVE.test("/* biome-ignore lint/a11y/useSemanticElements: a group */")).toBe(true);
		expect(SOURCE_DIRECTIVE.test('/// <reference types="next" />')).toBe(true);
		expect(SOURCE_DIRECTIVE.test("// @ts-expect-error")).toBe(true);
		expect(SOURCE_DIRECTIVE.test(["// @vitest", "environment jsdom"].join("-"))).toBe(true);
		expect(SOURCE_DIRECTIVE.test("// @ts-ignore")).toBe(false);
		expect(SOURCE_DIRECTIVE.test("// said")).toBe(false);
		expect(isShebang({ at: 0, text: "#!/usr/bin/env sh" })).toBe(true);
		expect(isShebang({ at: 12, text: "#!/usr/bin/env sh" })).toBe(false);
	});

	it("carries no comment but a tool directive or a generated file's banner, since a line's reason lives in the commit, the pull request, an ADR or CODING_STANDARDS.md", () => {
		const offenders: string[] = [];
		let allowed = 0;

		for (const file of commentedFiles) {
			const source = read(file);

			for (const { at, text } of commentsIn({ file, source })) {
				if (SOURCE_DIRECTIVE.test(text) || GENERATED_BANNER.test(text) || isShebang({ at, text })) allowed += 1;
				else offenders.push(`${file}:${lineAt({ source, at })}`);
			}
		}

		expect(allowed).toBeGreaterThan(0);
		expect(offenders).toEqual([]);
	});
});

describe("the succeeded-payment status is one value in both languages", () => {
	const PAYMENTS_REPOSITORY = `${WEB}/src/infrastructure/services/payments/repository.ts`;
	const SQL_STATUS_COMPARISON = /status\s*(?:!=|=)\s*'([^']*)'|WHEN \? = '([^']*)'/g;
	const SUCCEEDED_LITERAL = /['"]succeeded['"]/;
	const PAYMENT_STATUS_MODULE = `${WEB}/src/domain/payment/events/types.ts`;
	const CONFIRM_OUTCOME_MODULE = `${WEB}/src/ui/adapters/payments/checkout.ts`;
	const REDIRECT_STATUS_MODULE = `${WEB}/src/app/api/payment/activate/route.ts`;
	const STRIPE_PAYMENT_INTENTS = `${WEB}/node_modules/stripe/cjs/resources/PaymentIntents.d.ts`;
	const STRIPE_STATUS_UNION = /^\s*type Status = (.+);$/m;
	const STRIPE_STATUS_MEMBER = /'([^']+)'/g;

	it("compares the status column against that value and no other, in every SQL predicate", () => {
		const compared = [...read(PAYMENTS_REPOSITORY).matchAll(SQL_STATUS_COMPARISON)].map(
			([, quoted, whenQuoted]) => quoted ?? whenQuoted,
		);

		expect(compared.length).toBeGreaterThanOrEqual(4);
		expect([...new Set(compared)]).toEqual([PAYMENT_SUCCEEDED]);
	});

	it("lets no production module spell the literal, whether or not it imports the constant", () => {
		const exempt = new Set([
			PAYMENT_STATUS_MODULE,
			PAYMENTS_REPOSITORY,
			CONFIRM_OUTCOME_MODULE,
			REDIRECT_STATUS_MODULE,
		]);
		const candidates = sourceFiles
			.filter((path) => path.startsWith(`${WEB}/src/`) && !exempt.has(path))
			.filter((path) => !/\.test\.tsx?$/.test(path));

		expect(candidates.length).toBeGreaterThan(100);
		expect(candidates.filter((path) => SUCCEEDED_LITERAL.test(read(path)))).toEqual([]);
	});

	it.each([
		[CONFIRM_OUTCOME_MODULE, "ConfirmPaymentOutcome"],
		[REDIRECT_STATUS_MODULE, "redirect_status"],
	])("grants %s its exemption only while it still means something else by the word", (module, evidence) => {
		const source = read(module);

		expect(source).toContain(evidence);
		expect(source).not.toContain("PaymentStatus");
	});

	it("carries every status the installed Stripe SDK knows, and none it does not", () => {
		expect(
			existsSync(join(ROOT, STRIPE_PAYMENT_INTENTS)),
			`${STRIPE_PAYMENT_INTENTS} is absent, so this rule would read nothing`,
		).toBe(true);

		const union = read(STRIPE_PAYMENT_INTENTS).match(STRIPE_STATUS_UNION);
		expect(union, "no `type Status = …` in the Stripe SDK; it moved, so repoint this rule").not.toBeNull();

		const published = [...(union as RegExpMatchArray)[1].matchAll(STRIPE_STATUS_MEMBER)].map(([, member]) => member);

		expect(published.length).toBeGreaterThan(5);
		expect([...published].sort()).toEqual([...PAYMENT_STATUSES].sort());
	});
});

describe("directives sit where the compiler can see them", () => {
	const DIRECTIVES = new Set(["use client", "use server", "use cache", "use strict"]);
	const packageSources = sourceFiles.filter(
		(path) => path.startsWith(`${WEB}/src/`) || path.startsWith(`${DOCS}/src/`),
	);

	it("has sources to check at all", () => {
		expect(packageSources.length).toBeGreaterThan(100);
	});

	it("keeps every directive a bare string literal in first position", () => {
		const offenders: string[] = [];
		let checked = 0;

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

				checked += 1;
				const line = parsed.getLineAndCharacterOfPosition(statement.getStart(parsed)).line + 1;
				if (parenthesised)
					offenders.push(`${file}:${line} '${expression.text}' is parenthesised, so it is not a directive`);
				else if (index !== 0) offenders.push(`${file}:${line} '${expression.text}' is not the first statement`);
			});
		}

		expect(checked).toBeGreaterThan(50);
		expect(offenders).toEqual([]);
	});
});

describe("the published layer graph is the one the imports make", () => {
	const LAYER_NAMES = ["app", "application", "domain", "infrastructure", "ui"];
	const MIDDLEWARE_NODE = "middleware.ts";
	const OVERVIEW = `${DOCS}/src/content/docs/architecture/overview.mdx`;
	const GRAPH_TABLE_HEADER = "from / to";

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

	const reaches: (Edge & { file: string })[] = [];
	for (const file of webProduction) {
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

	const publishedGraph = () => {
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

	const UI_DATA_IMPORTERS = new Set([
		`${WEB_SRC}/infrastructure/i18n/config.ts`,
		`${WEB_SRC}/infrastructure/markdown/buildMarkdownPage.ts`,
	]);
	const LOCALE_BUNDLE = `${WEB_SRC}/ui/i18n/messages/`;

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
		const intoUi = reaches.filter(({ from, to }) => from === "infrastructure" && to === "ui");
		const offenders = intoUi.filter(({ file }) => !UI_DATA_IMPORTERS.has(file)).map(({ file }) => file);

		expect(intoUi.length).toBeGreaterThan(0);
		expect([...new Set(offenders)]).toEqual([]);
	});

	it("keeps those two on the locale bundles and nothing else in the ui layer", () => {
		const strayed: string[] = [];
		let checked = 0;
		for (const file of UI_DATA_IMPORTERS) {
			const source = read(file);
			IMPORT_SPECIFIER.lastIndex = 0;
			let match: RegExpExecArray | null = IMPORT_SPECIFIER.exec(source);
			while (match !== null) {
				const specifier = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5];
				const alias = specifier ? aliasTargets.find(([prefix]) => specifier.startsWith(prefix)) : undefined;
				const target = alias && specifier ? `${alias[1]}${specifier.slice(alias[0].length)}` : null;
				if (target && nodeOf(target) === "ui") {
					checked += 1;
					if (!target.startsWith(LOCALE_BUNDLE)) strayed.push(`${file} -> ${specifier}`);
				}
				match = IMPORT_SPECIFIER.exec(source);
			}
		}

		expect(checked).toBeGreaterThan(0);
		expect(strayed).toEqual([]);
	});
});

describe("the imports CODING_STANDARDS.md hands to this suite", () => {
	const CALENDAR = `${WEB_SRC}/domain/calendar/`;
	const PAYMENT = `${WEB_SRC}/domain/payment/`;
	const APPLICATION = `${WEB_SRC}/application/`;
	const UI = `${WEB_SRC}/ui/`;
	const CORE = `${UI}modules/core/`;
	const ANIMATE = `${CORE}animate/`;
	const ANIMATE_PRIMITIVES = `${ANIMATE}primitives/`;
	const inFolder = (folder: string) => webProduction.filter((path) => path.startsWith(folder));
	const lands = ({ from, specifier }: ResolveSpecifierParams) => `${resolveSpecifier({ from, specifier })}/`;

	const EFFECT_PACKAGE = /^(?:effect|@effect\/[^/]+)(?:\/|$)/;
	const sourceModules = new Set(sourceFiles);

	const eagerEffectImports = (entry: string) => {
		const reached = new Set([entry]);
		const queue = [entry];
		const found: string[] = [];
		for (let file = queue.shift(); file !== undefined; file = queue.shift())
			for (const { specifier, typeOnly, dynamic } of importsOf(file)) {
				if (typeOnly || dynamic) continue;
				if (EFFECT_PACKAGE.test(specifier)) found.push(`${entry}: ${file} -> ${specifier}`);
				const target = resolveSpecifier({ from: file, specifier });
				const module = [`${target}.ts`, `${target}.tsx`].find((candidate) => sourceModules.has(candidate));
				if (target && module && !reached.has(module)) {
					reached.add(module);
					queue.push(module);
				}
			}
		return found;
	};

	it("keeps Effect out of everything a DTO module loads, so a page that reads a bound or a code loads no Effect runtime", () => {
		const dto = inFolder(`${APPLICATION}dto/`);

		expect(eagerEffectImports(`${WEB_SRC}/ui/adapters/payments/checkout.ts`).length).toBeGreaterThan(0);
		expect(dto.length).toBeGreaterThan(10);
		expect(dto.flatMap(eagerEffectImports)).toEqual([]);
	});

	const MODULES = `${UI}modules/`;

	const folderOf = (file: string) => {
		const directory = `${dirname(file)}/`;
		if (file.startsWith(MODULES) && directory !== MODULES) {
			const [row, screen] = directory.slice(MODULES.length).split("/");
			return { root: row === "pages" && screen ? `${MODULES}pages/${screen}/` : `${MODULES}${row}/`, nested: true };
		}
		const depth = directory.slice(`${WEB_SRC}/`.length).split("/").filter(Boolean).length;
		return { root: directory, nested: depth > 1 };
	};

	interface InsideParams {
		file: string;
		target: string;
	}

	const inside = ({ file, target }: InsideParams) => {
		const { root, nested } = folderOf(file);
		return nested ? target.startsWith(root) : `${dirname(target)}/` === root;
	};

	it("imports across folders through the alias and within one by relative path, a screen and a row of ui/modules each one folder", () => {
		const imports = sourceFiles
			.filter((file) => file.startsWith(`${WEB_SRC}/`))
			.flatMap((file) =>
				importsOf(file).flatMap(({ specifier }) => {
					const target = resolveSpecifier({ from: file, specifier });
					return target.startsWith(`${WEB_SRC}/`)
						? [{ file, specifier, relative: specifier.startsWith("."), within: inside({ file, target }) }]
						: [];
				}),
			);
		const offenders = imports
			.filter(({ relative, within }) => relative !== within)
			.map(({ file, specifier, within }) => `${file} -> ${specifier} ${within ? "stays in" : "leaves"} its folder`);

		expect(
			inside({ file: `${MODULES}pages/planner/holidays/Row.tsx`, target: `${MODULES}pages/planner/CalendarList` }),
		).toBe(true);
		expect(
			inside({
				file: `${WEB_SRC}/infrastructure/layers.ts`,
				target: `${WEB_SRC}/infrastructure/clients/db/turso/service`,
			}),
		).toBe(false);
		expect(
			inside({ file: `${WEB_SRC}/domain/calendar/utils/helpers.ts`, target: `${WEB_SRC}/domain/calendar/types` }),
		).toBe(false);
		expect(imports.filter(({ within }) => within).length).toBeGreaterThan(300);
		expect(imports.filter(({ within }) => !within).length).toBeGreaterThan(300);
		expect(offenders).toEqual([]);
	});

	it("keeps the calendar and payment contexts apart, tests included", () => {
		const contexts = sourceFiles.filter((path) => path.startsWith(CALENDAR) || path.startsWith(PAYMENT));
		const crossed = contexts.flatMap((file) => {
			const other = file.startsWith(CALENDAR) ? PAYMENT : CALENDAR;
			return importsOf(file)
				.filter(({ specifier }) => lands({ from: file, specifier }).startsWith(other))
				.map(({ specifier }) => `${file} -> ${specifier}`);
		});

		expect(contexts.length).toBeGreaterThan(30);
		expect(crossed).toEqual([]);
	});

	const CALENDAR_OUTSIDE_IMPORTS = new Set([
		"@application/dto/holiday/types",
		"@application/shared/utils/dates",
		"temporal-polyfill",
	]);
	const CALENDAR_TYPE_IMPORTS = new Set(["next-intl"]);

	it("lets the calendar context import only the Holiday DTO types, the date helpers, the polyfill and the Locale type", () => {
		const outside = inFolder(CALENDAR).flatMap((file) =>
			importsOf(file)
				.filter(({ specifier }) => !lands({ from: file, specifier }).startsWith(CALENDAR))
				.map((imported) => ({ file, ...imported })),
		);
		const offenders = outside
			.filter(
				({ specifier, typeOnly }) =>
					!CALENDAR_OUTSIDE_IMPORTS.has(specifier) && !(typeOnly && CALENDAR_TYPE_IMPORTS.has(specifier)),
			)
			.map(({ file, specifier }) => `${file} -> ${specifier}`);

		expect(outside.length).toBeGreaterThan(0);
		expect(offenders).toEqual([]);
	});

	const STRIPE_SEAM = `${PAYMENT}events/factory/`;

	it("keeps Stripe at the payment event factory, as import type", () => {
		const stripe = inFolder(PAYMENT).flatMap((file) =>
			importsOf(file)
				.filter(({ specifier }) => specifier === "stripe" || specifier.startsWith("stripe/"))
				.map((imported) => ({ file, ...imported })),
		);
		const offenders = stripe
			.filter(({ file, typeOnly }) => !typeOnly || !file.startsWith(STRIPE_SEAM))
			.map(({ file }) => file);

		expect(stripe.length).toBeGreaterThan(0);
		expect(offenders).toEqual([]);
	});

	const STRIPE_JS = "@stripe/stripe-js";
	const STRIPE_JS_PURE = `${STRIPE_JS}/pure`;
	const STRIPE_LOADERS = new Set(["getStripeClientInstance", "getStripePromise"]);

	interface CallsNamedParams {
		source: ts.SourceFile;
		names: ReadonlySet<string>;
	}

	const callsNamed = ({ source, names }: CallsNamedParams) => {
		const found = { all: 0, atModuleScope: 0 };
		const visit = ({ node, inFunction }: { node: ts.Node; inFunction: boolean }) => {
			if (ts.isCallExpression(node)) {
				const callee = ts.isPropertyAccessExpression(node.expression)
					? node.expression.name.text
					: ts.isIdentifier(node.expression)
						? node.expression.text
						: "";
				if (names.has(callee)) {
					found.all += 1;
					if (!inFunction) found.atModuleScope += 1;
				}
			}
			ts.forEachChild(node, (child) => visit({ node: child, inFunction: inFunction || ts.isFunctionLike(node) }));
		};
		visit({ node: source, inFunction: false });
		return found;
	};

	it("imports Stripe.js through its pure entry, because the bare entry fetches the script the moment it is imported", () => {
		const stripe = webProduction.flatMap((file) =>
			importsOf(file)
				.filter(({ specifier }) => specifier === STRIPE_JS || specifier === STRIPE_JS_PURE)
				.map((imported) => ({ file, ...imported })),
		);
		const offenders = stripe
			.filter(({ specifier, typeOnly }) => specifier === STRIPE_JS && !typeOnly)
			.map(({ file }) => file);

		expect(stripe.some(({ specifier, typeOnly }) => specifier === STRIPE_JS_PURE && !typeOnly)).toBe(true);
		expect(stripe.some(({ specifier, typeOnly }) => specifier === STRIPE_JS && typeOnly)).toBe(true);
		expect(offenders).toEqual([]);
	});

	it("asks for Stripe.js only inside a function, never while a module loads, so a visitor who never donates never fetches it", () => {
		const callers = webProduction.map((file) => ({
			file,
			...callsNamed({ source: parse(file), names: STRIPE_LOADERS }),
		}));
		const offenders = callers.filter(({ atModuleScope }) => atModuleScope > 0).map(({ file }) => file);

		expect(callers.reduce((total, { all }) => total + all, 0)).toBeGreaterThan(0);
		expect(offenders).toEqual([]);
	});

	it("tells a Stripe load made while a module loads from one made inside a function", () => {
		const probe = (text: string) =>
			callsNamed({
				source: ts.createSourceFile("probe.ts", text, ts.ScriptTarget.Latest, true),
				names: STRIPE_LOADERS,
			});

		expect(probe("const promise = getStripeClientInstance().getStripePromise();")).toEqual({
			all: 2,
			atModuleScope: 2,
		});
		expect(probe("const load = () => getStripeClientInstance().getStripePromise();")).toEqual({
			all: 2,
			atModuleScope: 0,
		});
		expect(probe("export function Donate() { useEffect(() => { getStripePromise(); }, []); }")).toEqual({
			all: 1,
			atModuleScope: 0,
		});
	});

	const APPLICATION_UNREACHABLE = [
		"next/server",
		"next/headers",
		"@opennextjs/cloudflare",
		"@tursodatabase/serverless",
		"resend",
		"@stripe/stripe-js",
	];
	const EMAIL_TEMPLATES = `${APPLICATION}email/templates/`;
	const SDK_CONSTRUCTION = /\bnew\s+(?:Stripe|Resend)\s*\(/;

	it("keeps the application layer free of the request, the runtime context, SDK construction and components", () => {
		const application = inFolder(APPLICATION);
		const offenders = application.flatMap((file) => [
			...importsOf(file)
				.filter(({ specifier }) =>
					APPLICATION_UNREACHABLE.some((module) => specifier === module || specifier.startsWith(`${module}/`)),
				)
				.map(({ specifier }) => `${file} -> ${specifier}`),
			...(SDK_CONSTRUCTION.test(read(file)) ? [`${file} constructs an SDK client`] : []),
			...(file.endsWith(".tsx") && !file.startsWith(EMAIL_TEMPLATES) ? [`${file} is a component`] : []),
		]);

		expect(application.length).toBeGreaterThan(30);
		expect(offenders).toEqual([]);
	});

	const UI_INVERSION = `${APPLICATION}stores/premium.ts`;

	it("lets stores/premium.ts alone reach the ui layer from application", () => {
		const application = inFolder(APPLICATION);
		const intoUi = application.filter(
			(file) =>
				file !== UI_INVERSION &&
				importsOf(file).some(({ specifier }) => lands({ from: file, specifier }).startsWith(UI)),
		);

		expect(application.length).toBeGreaterThan(30);
		expect(intoUi).toEqual([]);
	});

	const DEFERRED_MODULES = new Set([
		`${WEB_SRC}/domain/calendar/pipeline`,
		`${WEB_SRC}/infrastructure/services/holidays/getHolidays`,
		`${WEB_SRC}/infrastructure/services/regions/getRegions`,
	]);

	it("reaches the planning pipeline and the holiday lookups from the stores through import() alone", () => {
		const reached = inFolder(`${APPLICATION}stores/`).flatMap((file) =>
			importsOf(file)
				.filter(({ specifier }) => DEFERRED_MODULES.has(resolveSpecifier({ from: file, specifier })))
				.map((imported) => ({ file, ...imported })),
		);
		const eager = reached
			.filter(({ dynamic, typeOnly }) => !dynamic && !typeOnly)
			.map(({ file, specifier }) => `${file} -> ${specifier}`);

		expect(reached.some(({ dynamic }) => dynamic)).toBe(true);
		expect(eager).toEqual([]);
	});

	const TURSO_CLIENT = `${WEB_SRC}/infrastructure/clients/db/turso/service.ts`;
	const CONNECTION_STATEMENTS = new Set(["all", "run"]);

	it("runs every Turso statement with all or run inside withConnection, and nowhere but the client", () => {
		const driverImporters = sourceFiles.filter(
			(file) =>
				file.startsWith(`${WEB}/`) &&
				!TEST_FILE.test(file) &&
				importsOf(file).some(({ specifier }) => specifier.startsWith("@tursodatabase/")),
		);
		const client = parse(TURSO_CLIENT);
		const statements: string[] = [];
		const stray: string[] = [];
		const insideWithConnection = (node: ts.Node): boolean => {
			for (let parent = node.parent; parent; parent = parent.parent)
				if (ts.isCallExpression(parent) && parent.expression.getText(client) === "withConnection") return true;
			return false;
		};
		const visit = (node: ts.Node) => {
			if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
				const method = node.expression.name.text;
				const line = client.getLineAndCharacterOfPosition(node.getStart(client)).line + 1;
				if (node.expression.expression.getText(client) === "connection") {
					statements.push(method);
					if (!CONNECTION_STATEMENTS.has(method) && method !== "close") stray.push(`line ${line}: ${method}`);
					else if (CONNECTION_STATEMENTS.has(method) && !insideWithConnection(node))
						stray.push(`line ${line}: ${method} outside withConnection`);
				}
			}
			ts.forEachChild(node, visit);
		};
		visit(client);

		expect(driverImporters).toEqual([TURSO_CLIENT]);
		expect(statements.filter((method) => CONNECTION_STATEMENTS.has(method)).length).toBeGreaterThan(1);
		expect(stray).toEqual([]);
	});

	const REQUEST_SCOPED_TRANSLATOR = "next-intl/server";
	const SOURCE_EXTENSIONS = [".ts", ".tsx"];

	it("keeps next-intl/server out of every route handler and everything it reaches", () => {
		const handlers = webProduction.filter((file) => file.endsWith("/route.ts"));
		const reached = new Set<string>();
		const pending = [...handlers];
		while (pending.length > 0) {
			const file = pending.pop() as string;
			if (reached.has(file)) continue;
			reached.add(file);
			for (const { specifier, typeOnly } of importsOf(file)) {
				if (typeOnly) continue;
				const target = resolveSpecifier({ from: file, specifier });
				const next = SOURCE_EXTENSIONS.map((extension) => `${target}${extension}`).find(
					(candidate) => target !== "" && existsSync(join(ROOT, candidate)),
				);
				if (next) pending.push(next);
			}
		}
		const offenders = [...reached].filter((file) =>
			importsOf(file).some(({ specifier, typeOnly }) => specifier === REQUEST_SCOPED_TRANSLATOR && !typeOnly),
		);

		expect(handlers.length).toBeGreaterThan(5);
		expect(reached.size).toBeGreaterThan(handlers.length);
		expect(offenders).toEqual([]);
	});

	const COUNTRY_DETECTION = `${WEB_SRC}/infrastructure/services/location/`;
	const NO_STORE_FETCH = `${COUNTRY_DETECTION}utils/normalize.ts`;
	const BARE_FETCH = /\bfetch\s*\(/;

	it("fetches for Country detection only through noStoreFetch, which stores nothing", () => {
		const fetching = inFolder(COUNTRY_DETECTION).filter((file) => BARE_FETCH.test(read(file)));

		expect(fetching).toEqual([NO_STORE_FETCH]);
		expect(read(NO_STORE_FETCH)).toContain('cache: "no-store"');
	});

	const LOCALE_UNAWARE_NAVIGATION = new Set(["Link", "useRouter", "usePathname", "redirect", "permanentRedirect"]);
	const LOCALE_AWARE_NAVIGATION = "@application/i18n/navigation";

	it("takes Link, useRouter and usePathname in the ui layer from the locale-aware navigation", () => {
		const ui = inFolder(UI);
		const offenders = ui.flatMap((file) =>
			importsOf(file)
				.filter(
					({ specifier, names }) =>
						specifier === "next/link" ||
						(specifier === "next/navigation" && names.some((name) => LOCALE_UNAWARE_NAVIGATION.has(name))),
				)
				.map(({ specifier }) => `${file} -> ${specifier}`),
		);

		expect(ui.some((file) => importsOf(file).some(({ specifier }) => specifier === LOCALE_AWARE_NAVIGATION))).toBe(
			true,
		);
		expect(offenders).toEqual([]);
	});

	const SERVER_ACTION_DIRECTIVE = /^\s*["']use server["']/m;

	it("declares no server action and reads no request headers in the ui layer", () => {
		const ui = inFolder(UI);
		const offenders = ui.filter(
			(file) =>
				SERVER_ACTION_DIRECTIVE.test(read(file)) ||
				importsOf(file).some(({ specifier }) => specifier === "next/headers"),
		);

		expect(ui.length).toBeGreaterThan(100);
		expect(offenders).toEqual([]);
	});

	const TRANSLATION = /\b(?:useTranslations|getTranslations)\b/;

	it("keeps core free of stores, translations and fetching", () => {
		const core = inFolder(CORE);
		const offenders = core.flatMap((file) => {
			const source = read(file);
			return [
				...(TRANSLATION.test(source) ? [`${file} translates`] : []),
				...(BARE_FETCH.test(source) ? [`${file} fetches`] : []),
				...importsOf(file)
					.filter(({ specifier }) => lands({ from: file, specifier }).startsWith(`${APPLICATION}stores/`))
					.map(({ specifier }) => `${file} -> ${specifier}`),
			];
		});

		expect(core.length).toBeGreaterThan(50);
		expect(offenders).toEqual([]);
	});

	it("keeps core/animate/primitives internal to core/animate, in both packages", () => {
		const reachesPrimitives = (file: string) =>
			importsOf(file).some(({ specifier }) => lands({ from: file, specifier }).startsWith(ANIMATE_PRIMITIVES));
		const packages = sourceFiles.filter((file) => file.startsWith(`${WEB}/`) || file.startsWith(`${DOCS}/`));
		const offenders = packages.filter((file) => !file.startsWith(ANIMATE) && reachesPrimitives(file));

		expect(packages.some((file) => file.startsWith(ANIMATE) && reachesPrimitives(file))).toBe(true);
		expect(offenders).toEqual([]);
	});

	it("imports m from motion/react, never motion or framer-motion", () => {
		const web = sourceFiles.filter((file) => file.startsWith(`${WEB}/`));
		const offenders = web.flatMap((file) =>
			importsOf(file)
				.filter(
					({ specifier, names, namespace }) =>
						specifier === "framer-motion" ||
						specifier.startsWith("framer-motion/") ||
						(specifier === "motion/react" && (namespace || names.includes("motion"))),
				)
				.map(({ specifier }) => `${file} -> ${specifier}`),
		);

		expect(
			web.some((file) =>
				importsOf(file).some(({ specifier, names }) => specifier === "motion/react" && names.includes("m")),
			),
		).toBe(true);
		expect(offenders).toEqual([]);
	});

	const TEMPORAL_USE = /\bTemporal\./;

	it("takes Temporal from temporal-polyfill wherever apps/web uses it", () => {
		const users = sourceFiles.filter((file) => file.startsWith(`${WEB}/`) && TEMPORAL_USE.test(read(file)));
		const offenders = users.filter(
			(file) =>
				!importsOf(file).some(
					({ specifier, names }) => specifier === "temporal-polyfill" && names.includes("Temporal"),
				),
		);

		expect(users.length).toBeGreaterThan(0);
		expect(offenders).toEqual([]);
	});

	const INDEX_MODULE = /(?:^|\/)index\.tsx?$/;

	it("has no index module in either package", () => {
		const packages = sourceFiles.filter((file) => file.startsWith(`${WEB}/`) || file.startsWith(`${DOCS}/`));

		expect(packages.length).toBeGreaterThan(500);
		expect(packages.filter((file) => INDEX_MODULE.test(file))).toEqual([]);
	});
});

describe("the code keeps the mechanical rules CODING_STANDARDS.md hands to this suite", () => {
	const CALENDAR = `${WEB_SRC}/domain/calendar/`;

	const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

	interface DeclaredFunction {
		name: string;
		signature: ts.SignatureDeclarationBase;
		line: number;
	}

	const declaredFunctions = (parsed: ts.SourceFile): DeclaredFunction[] => {
		const found: DeclaredFunction[] = [];
		const visit = (node: ts.Node) => {
			let name: string | undefined;
			let signature: ts.SignatureDeclarationBase | undefined;
			if (ts.isFunctionDeclaration(node) && node.name) {
				name = node.name.text;
				signature = node;
			} else if (
				ts.isVariableDeclaration(node) &&
				ts.isIdentifier(node.name) &&
				node.initializer &&
				(ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
			) {
				name = node.name.text;
				signature = node.initializer;
			}
			if (name && signature)
				found.push({ name, signature, line: parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1 });
			ts.forEachChild(node, visit);
		};
		visit(parsed);
		return found;
	};

	interface PositionalFunctionsParams {
		path: string;
		parsed: ts.SourceFile;
	}

	const positionalFunctions = ({ path, parsed }: PositionalFunctionsParams) =>
		declaredFunctions(parsed)
			.filter(
				({ name, signature }) =>
					signature.parameters.filter(
						(parameter) => !(ts.isIdentifier(parameter.name) && parameter.name.text === "this"),
					).length > 1 && !(path.endsWith("/route.ts") && HTTP_METHODS.has(name)),
			)
			.map(({ name, line }) => `${path}:${line} ${name}`);

	it("gives no function two positional parameters, in apps/web, its tests, its e2e specs or this suite", () => {
		const scope = sourceFiles.filter(
			(file) => file.startsWith(`${WEB_SRC}/`) || file.startsWith(`${WEB}/e2e/`) || file.startsWith("tests/"),
		);
		const synthetic = ts.createSourceFile(
			"synthetic.ts",
			"const pair = (a: number, b: number) => a + b;",
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		const offenders = scope.flatMap((path) => positionalFunctions({ path, parsed: parse(path) }));

		expect(positionalFunctions({ path: "synthetic.ts", parsed: synthetic })).toEqual(["synthetic.ts:1 pair"]);
		expect(scope.length).toBeGreaterThan(500);
		expect(offenders).toEqual([]);
	});

	const PARAMS_TYPE_NAME = /Params$/;
	const COMPONENT_NAME = /^[A-Z]/;
	const CHILDREN_PROP = "children";

	interface ParamsDeclaration {
		name: string;
		fields: number;
		extended: boolean;
		line: number;
	}

	const paramsDeclarations = (parsed: ts.SourceFile): ParamsDeclaration[] => {
		const found: ParamsDeclaration[] = [];
		const visit = (node: ts.Node) => {
			const members = ts.isInterfaceDeclaration(node)
				? node.members
				: ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)
					? node.type.members
					: undefined;
			if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) && members !== undefined) {
				if (PARAMS_TYPE_NAME.test(node.name.text))
					found.push({
						name: node.name.text,
						fields: members.length,
						extended: ts.isInterfaceDeclaration(node) && (node.heritageClauses?.length ?? 0) > 0,
						line: parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1,
					});
			}
			ts.forEachChild(node, visit);
		};
		visit(parsed);
		return found;
	};

	interface InlineParameterType {
		function: string;
		fields: ts.NodeArray<ts.TypeElement>;
		line: number;
	}

	const inlineParameterTypes = (parsed: ts.SourceFile): InlineParameterType[] =>
		declaredFunctions(parsed).flatMap(({ name, signature, line }) =>
			signature.parameters.flatMap((parameter) =>
				parameter.type !== undefined && ts.isTypeLiteralNode(parameter.type)
					? [{ function: name, fields: parameter.type.members, line }]
					: [],
			),
		);

	const takesProps = ({ function: name, fields }: InlineParameterType) =>
		COMPONENT_NAME.test(name) || (fields.length === 1 && fields[0]?.name?.getText() === CHILDREN_PROP);

	interface SingleFieldParametersParams {
		path: string;
		parsed: ts.SourceFile;
	}

	const singleFieldParameters = ({ path, parsed }: SingleFieldParametersParams) => [
		...paramsDeclarations(parsed)
			.filter(({ fields, extended }) => fields < 2 && !extended)
			.map(({ name, line }) => `${path}:${line} ${name}`),
		...inlineParameterTypes(parsed)
			.filter((inline) => inline.fields.length < 2 && !takesProps(inline))
			.map(({ function: name, line }) => `${path}:${line} ${name}`),
	];

	it("gives no params type, and no inline parameter type, a single field of its own", () => {
		const scope = sourceFiles.filter(
			(file) => file.startsWith(`${WEB_SRC}/`) || file.startsWith(`${WEB}/e2e/`) || file.startsWith("tests/"),
		);
		const synthetic = ts.createSourceFile(
			"synthetic.tsx",
			[
				"interface OneParams { a: string }",
				"type PairParams = { a: string; check: (value: string) => boolean }",
				"type AliasParams = { a: string }",
				"interface ExtendedParams extends Base { a: string }",
				"const one = ({ a }: { a: string }) => a;",
				"function plain(tree: { container: HTMLElement }) { return tree; }",
				"const Component = ({ label }: { label: string }) => label;",
				"const wrapper = ({ children }: { children: ReactNode }) => children;",
				"const pair = ({ a, b }: { a: string; b: string }) => a + b;",
				"const callback = (state: { open: boolean }) => state.open;",
			].join("\n"),
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TSX,
		);
		const parsed = scope.map((path) => parse(path));

		expect(singleFieldParameters({ path: "synthetic.tsx", parsed: synthetic })).toEqual([
			"synthetic.tsx:1 OneParams",
			"synthetic.tsx:3 AliasParams",
			"synthetic.tsx:5 one",
			"synthetic.tsx:6 plain",
			"synthetic.tsx:10 callback",
		]);
		expect(parsed.flatMap(paramsDeclarations).length).toBeGreaterThan(200);
		expect(
			parsed.flatMap((file) => paramsDeclarations(file).filter(({ fields }) => fields > 1)).length,
		).toBeGreaterThan(150);
		expect(parsed.flatMap(inlineParameterTypes).filter(takesProps).length).toBeGreaterThan(10);
		expect(
			scope.flatMap((path, index) => singleFieldParameters({ path, parsed: parsed[index] as ts.SourceFile })),
		).toEqual([]);
	});

	const EFFECT_HOOKS = new Set(["useEffect", "useLayoutEffect", "useInsertionEffect"]);
	const VIEWS_AN_EFFECT_COUNTS = [`${WEB_SRC}/ui/modules/pages/planner/Contact.tsx contact_opened`];

	interface TracksInEffectsParams {
		path: string;
		parsed: ts.SourceFile;
	}

	const tracksInEffects = ({ path, parsed }: TracksInEffectsParams) => {
		const found: string[] = [];
		const visit = (inEffect: boolean) => (node: ts.Node) => {
			const callee = ts.isCallExpression(node) && ts.isIdentifier(node.expression) ? node.expression.text : undefined;
			if (inEffect && callee === "track")
				found.push(`${path} ${node.getText(parsed).match(/event:\s*"([^"]+)"/)?.[1] ?? "unnamed"}`);
			ts.forEachChild(node, visit(inEffect || (callee !== undefined && EFFECT_HOOKS.has(callee))));
		};
		visit(false)(parsed);
		return found;
	};

	it("calls track() where the interaction lands and never inside an effect, bar the view a #contact link opens", () => {
		const synthetic = ts.createSourceFile(
			"synthetic.tsx",
			'useEffect(() => { track({ event: "a" }); }, []); const onClick = () => track({ event: "b" });',
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TSX,
		);
		const found = webProduction.flatMap((path) => tracksInEffects({ path, parsed: parse(path) }));

		expect(tracksInEffects({ path: "synthetic.tsx", parsed: synthetic })).toEqual(["synthetic.tsx a"]);
		expect(found.filter((site) => VIEWS_AN_EFFECT_COUNTS.includes(site))).toEqual(VIEWS_AN_EFFECT_COUNTS);
		expect(found.filter((site) => !VIEWS_AN_EFFECT_COUNTS.includes(site))).toEqual([]);
	});

	const ENGINE_DECLARATIONS = new Set([`${CALENDAR}const.ts`, `${CALENDAR}window.ts`]);
	const IDENTITIES = new Set(["0", "1"]);
	const PERCENTAGE = "100";

	it("keeps every other number in the planning engine in PTO_CONSTANTS", () => {
		const engine = webProduction.filter((file) => file.startsWith(CALENDAR) && !ENGINE_DECLARATIONS.has(file));
		const bare: string[] = [];
		for (const file of engine) {
			const parsed = parse(file);
			const visit = (node: ts.Node) => {
				const percentage =
					node.parent !== undefined &&
					ts.isBinaryExpression(node.parent) &&
					node.parent.operatorToken.kind === ts.SyntaxKind.AsteriskToken;
				if (ts.isNumericLiteral(node) && !IDENTITIES.has(node.text) && !(node.text === PERCENTAGE && percentage))
					bare.push(`${file}:${parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1} ${node.text}`);
				ts.forEachChild(node, visit);
			};
			visit(parsed);
		}

		expect(engine.length).toBeGreaterThan(15);
		expect(bare).toEqual([]);
	});

	const DATE_LIBRARY = `${WEB_SRC}/application/shared/utils/dates.ts`;
	const DATE_FORMATTING = /\bIntl\.DateTimeFormat\s*\(|\.toLocale(?:Date|Time)String\s*\(/;

	it("builds a date format in the date library alone", () => {
		expect(webProduction.filter((file) => DATE_FORMATTING.test(read(file)))).toEqual([DATE_LIBRARY]);
	});

	const HOLIDAY_RULES = `${WEB_SRC}/application/dto/holiday/rules.ts`;
	const WINDOW_FLAG_READ = /\.isInPlanningWindow\b/;

	it("reads a Holiday's isInPlanningWindow in the Holiday rules alone", () => {
		expect(webProduction.filter((file) => WINDOW_FLAG_READ.test(read(file)))).toEqual([HOLIDAY_RULES]);
	});

	const JSON_BODY_READER = `${WEB_SRC}/infrastructure/api/parseJsonBody.ts`;
	const RAW_BODY_READER = `${WEB_SRC}/app/api/webhooks/stripe/route.ts`;
	const JSON_BODY = /\b(?:request|req)\.json\s*\(/;
	const RAW_BODY = /\b(?:request|req)\.text\s*\(/;

	it("reads a JSON body only through parseJsonBody, and raw text only in the Stripe webhook", () => {
		expect({
			json: webProduction.filter((file) => JSON_BODY.test(read(file))),
			text: webProduction.filter((file) => RAW_BODY.test(read(file))),
		}).toEqual({ json: [JSON_BODY_READER], text: [RAW_BODY_READER] });
	});

	const isJsonRead = (node: ts.Node): boolean => {
		let inner = node;
		while (ts.isParenthesizedExpression(inner) || ts.isAwaitExpression(inner) || ts.isYieldExpression(inner)) {
			if (!inner.expression) return false;
			inner = inner.expression;
		}
		if (!ts.isCallExpression(inner)) return false;
		if (ts.isPropertyAccessExpression(inner.expression) && inner.expression.name.text === "json")
			return inner.arguments.length === 0;
		const [thunk] = inner.arguments;
		return inner.arguments.length === 1 && thunk !== undefined && ts.isArrowFunction(thunk) && isJsonRead(thunk.body);
	};

	interface UncheckedJsonReadsParams {
		path: string;
		parsed: ts.SourceFile;
	}

	const uncheckedJsonReads = ({ path, parsed }: UncheckedJsonReadsParams) => {
		const found: string[] = [];
		const visit = (node: ts.Node) => {
			const cast = (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) && isJsonRead(node.expression);
			const typed =
				ts.isVariableDeclaration(node) &&
				node.initializer !== undefined &&
				isJsonRead(node.initializer) &&
				node.type?.kind !== ts.SyntaxKind.UnknownKeyword;
			if (cast || typed) found.push(`${path}:${parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1}`);
			ts.forEachChild(node, visit);
		};
		visit(parsed);
		return found;
	};

	it("reads every JSON answer as unknown, never through a cast or a typed binding", () => {
		const synthetic = ts.createSourceFile(
			"synthetic.ts",
			[
				"async function* read() {",
				"	const cast = (await response.json()) as Session;",
				"	const typed: Session = await response.json();",
				"	const inferred = yield* Effect.tryPromise(() => response.json());",
				"	const checked: unknown = yield* Effect.tryPromise(() => response.json());",
				"}",
			].join("\n"),
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);

		expect(uncheckedJsonReads({ path: "synthetic.ts", parsed: synthetic })).toEqual([
			"synthetic.ts:2",
			"synthetic.ts:3",
			"synthetic.ts:4",
		]);
		expect(webProduction.flatMap((path) => uncheckedJsonReads({ path, parsed: parse(path) }))).toEqual([]);
	});

	const ZOD_SPECIFIER = /^zod(?:\/|$)/;
	const SCHEMA_NAME = /^[a-z][A-Za-z]*Schema$/;

	const calleeRoot = (expression: ts.Expression): string | undefined => {
		let node = expression;
		while (ts.isPropertyAccessExpression(node) || ts.isCallExpression(node)) node = node.expression;
		return ts.isIdentifier(node) ? node.text : undefined;
	};

	const moduleSchemas = (parsed: ts.SourceFile): string[] => {
		const roots = new Set(
			parsed.statements.flatMap((statement) => {
				if (
					!ts.isImportDeclaration(statement) ||
					!ts.isStringLiteral(statement.moduleSpecifier) ||
					!ZOD_SPECIFIER.test(statement.moduleSpecifier.text)
				)
					return [];
				const clause = statement.importClause;
				const bindings = clause?.namedBindings;
				return [
					...(clause?.name ? [clause.name.text] : []),
					...(bindings && ts.isNamespaceImport(bindings) ? [bindings.name.text] : []),
					...(bindings && ts.isNamedImports(bindings) ? bindings.elements.map((element) => element.name.text) : []),
				];
			}),
		);
		const factories = new Set<string>();
		const schemas: string[] = [];
		for (const statement of parsed.statements) {
			if (!ts.isVariableStatement(statement)) continue;
			for (const { name, initializer } of statement.declarationList.declarations) {
				if (!ts.isIdentifier(name) || initializer === undefined) continue;
				if (ts.isArrowFunction(initializer)) {
					if (!ts.isBlock(initializer.body) && roots.has(calleeRoot(initializer.body) ?? "")) factories.add(name.text);
					continue;
				}
				const root = calleeRoot(initializer) ?? "";
				if (roots.has(root) || factories.has(root) || schemas.includes(root)) schemas.push(name.text);
			}
		}
		return schemas;
	};

	it("names every module-level schema <concept>Schema, after what it checks", () => {
		const synthetic = ts.createSourceFile(
			"synthetic.ts",
			[
				'import { z } from "zod";',
				"export const bodyShape = z.object({});",
				"const querySchema = z.object({ q: z.string() });",
				"const loose = querySchema.partial();",
				"const createFormSchema = (message: string) => z.string().min(1, message);",
				'const formSchema = createFormSchema("x");',
			].join("\n"),
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		const schemas = webProduction.flatMap((path) => moduleSchemas(parse(path)).map((name) => ({ path, name })));

		expect(moduleSchemas(synthetic)).toEqual(["bodyShape", "querySchema", "loose", "formSchema"]);
		expect(schemas.length).toBeGreaterThan(5);
		expect(schemas.filter(({ name }) => !SCHEMA_NAME.test(name)).map(({ path, name }) => `${path}: ${name}`)).toEqual(
			[],
		);
	});

	const NEXT_SEARCH_PARAMS = "Promise<Record<string, string | string[] | undefined>>";

	interface SearchParamsTypesParams {
		path: string;
		parsed: ts.SourceFile;
	}

	const searchParamsTypes = ({ path, parsed }: SearchParamsTypesParams) => {
		const found: { path: string; type: string }[] = [];
		const visit = (node: ts.Node) => {
			if (ts.isPropertySignature(node) && node.name.getText(parsed) === "searchParams" && node.type)
				found.push({ path, type: node.type.getText(parsed).replace(/\s+/g, " ") });
			ts.forEachChild(node, visit);
		};
		visit(parsed);
		return found;
	};

	it("types every page's searchParams as the record Next hands over, a repeated parameter included", () => {
		const pages = sourceFiles.filter((file) => file.startsWith(`${WEB_SRC}/app/`) && file.endsWith("/page.tsx"));
		const declared = pages.flatMap((path) => searchParamsTypes({ path, parsed: parse(path) }));

		expect(declared.length).toBeGreaterThan(0);
		expect(declared.filter(({ type }) => type !== NEXT_SEARCH_PARAMS)).toEqual([]);
	});

	const ROUTE_METADATA_LINE = /^export const generateMetadata = routeMetadata\("[^"]*"\);$/m;

	it("declares every page's metadata as one routeMetadata line, with no metadata module beside it", () => {
		const app = sourceFiles.filter((file) => file.startsWith(`${WEB_SRC}/app/`));
		const pages = app.filter((file) => file.endsWith("/page.tsx"));
		const offenders = [
			...pages.filter((file) => !ROUTE_METADATA_LINE.test(read(file))),
			...app.filter((file) => /\/metadata\.tsx?$/.test(file)),
		];

		expect(pages.length).toBeGreaterThan(5);
		expect(offenders).toEqual([]);
	});

	const CACHE_DIRECTIVE = /["']use cache(?::\s*\w+)?["']/;

	it("leaves 'use cache' and cacheComponents out", () => {
		expect(webProduction.length).toBeGreaterThan(300);
		expect(webProduction.filter((file) => CACHE_DIRECTIVE.test(read(file)))).toEqual([]);
		expect(webNextConfig.cacheComponents ?? false).toBe(false);
	});

	interface JsxElementsParams {
		parsed: ts.SourceFile;
		tag: string;
	}

	const jsxElements = ({ parsed, tag }: JsxElementsParams) => {
		const found: Map<string, string | undefined>[] = [];
		const visit = (node: ts.Node) => {
			if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(parsed) === tag)
				found.push(
					new Map(
						node.attributes.properties
							.filter((property) => ts.isJsxAttribute(property))
							.map((property) => [property.name.getText(parsed), property.initializer?.getText(parsed)]),
					),
				);
			ts.forEachChild(node, visit);
		};
		visit(parsed);
		return found;
	};

	const components = webProduction.filter((file) => file.endsWith(".tsx"));

	it("gives every Skeleton with a fixture that same component as its fallback", () => {
		const skeletons = components.flatMap((file) =>
			jsxElements({ parsed: parse(file), tag: "Skeleton" }).map((attributes) => ({ file, attributes })),
		);
		const withFixture = skeletons.filter(({ attributes }) => attributes.has("fixture"));
		const mismatched = withFixture
			.filter(({ attributes }) => attributes.get("fallback") !== attributes.get("fixture"))
			.map(({ file }) => file);

		expect(withFixture.length).toBeGreaterThan(0);
		expect(mismatched).toEqual([]);
	});

	const DIALOG_SIZING = /\bmax-h-|\boverflow-/;

	it("leaves a dialog's height and scroll to Dialog", () => {
		const dialogs = components.flatMap((file) =>
			jsxElements({ parsed: parse(file), tag: "DialogContent" }).map((attributes) => ({ file, attributes })),
		);
		const sized = dialogs
			.filter(({ attributes }) => DIALOG_SIZING.test(attributes.get("className") ?? ""))
			.map(({ file }) => file);

		expect(dialogs.length).toBeGreaterThan(3);
		expect(sized).toEqual([]);
	});

	const NUMBER_TYPE = /^\{?\s*["']number["']\s*\}?$/;

	const numberInputsIn = (parsed: ts.SourceFile) => {
		const found: number[] = [];
		const visit = (node: ts.Node) => {
			if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
				const typed = node.attributes.properties.find(
					(property): property is ts.JsxAttribute =>
						ts.isJsxAttribute(property) &&
						property.name.getText(parsed) === "type" &&
						NUMBER_TYPE.test(property.initializer?.getText(parsed) ?? ""),
				);
				if (typed) found.push(parsed.getLineAndCharacterOfPosition(typed.getStart(parsed)).line + 1);
			}
			ts.forEachChild(node, visit);
		};
		visit(parsed);
		return found;
	};

	it('draws a number the visitor types with NumberInput and never as type="number", whose browser reads no separator but the point', () => {
		const probe = (text: string) =>
			numberInputsIn(ts.createSourceFile("probe.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX));
		const offenders = components.flatMap((file) => numberInputsIn(parse(file)).map((line) => `${file}:${line}`));

		expect(components.length).toBeGreaterThan(100);
		expect(probe('const field = <input type="number" min={0} />;')).toEqual([1]);
		expect(probe("const field = <Input type={'number'} />;")).toEqual([1]);
		expect(probe('const field = <Input type="text" inputMode="numeric" />;')).toEqual([]);
		expect(offenders).toEqual([]);
	});

	const PROGRAMMATIC_FOCUS = new Set([`${WEB_SRC}/ui/modules/core/animate/base/Drawer.tsx`]);
	const RING_SUPPRESSION = /(?<![\w-])focus:outline-none/;

	it("drops the focus ring with focus:outline-none only on the programmatically focused drawer panel", () => {
		const suppressing = webProduction.filter((file) => RING_SUPPRESSION.test(read(file)));

		expect(RING_SUPPRESSION.test("rounded focus:outline-none")).toBe(true);
		expect(suppressing.filter((file) => !PROGRAMMATIC_FOCUS.has(file))).toEqual([]);
	});

	it("gives every route handler a co-located route.test.ts, and tucks no test into a __tests__ folder", () => {
		const handlers = webProduction.filter((file) => file.endsWith("/route.ts"));

		expect(handlers.length).toBeGreaterThan(5);
		expect({
			untested: handlers.filter((file) => !existsSync(join(ROOT, file.replace(/\.ts$/, ".test.ts")))),
			tucked: trackedFiles.filter((file) => file.includes("/__tests__/")),
		}).toEqual({ untested: [], tucked: [] });
	});

	const tests = sourceFiles.filter(
		(file) =>
			(file.startsWith(`${WEB}/`) && (TEST_FILE.test(file) || file.includes("/e2e/"))) || file.startsWith("tests/"),
	);

	const CLIENT_SECRET_SHAPE = /\bpi_[A-Za-z0-9]+_secret_/;

	it("shapes no fixture like a real Stripe client secret, which secret scanners cannot tell from a leak", () => {
		expect(CLIENT_SECRET_SHAPE.test(["pi", "3AbC", "secret", "xyz"].join("_"))).toBe(true);
		expect(tests.length).toBeGreaterThan(300);
		expect(tests.filter((file) => CLIENT_SECRET_SHAPE.test(read(file)))).toEqual([]);
	});

	const DATE_ONLY_STRING = /new Date\(\s*["'`]\d{4}-\d{2}-\d{2}["'`]\s*\)/;

	it("builds no fixture day from a date-only ISO string, which parses as UTC midnight and so as the previous day west of UTC", () => {
		expect(DATE_ONLY_STRING.test(`new Date("${"2025-01-06"}")`)).toBe(true);
		expect(tests.filter((file) => DATE_ONLY_STRING.test(read(file)))).toEqual([]);
	});

	const unitTests = sourceFiles.filter((file) => file.startsWith(`${WEB_SRC}/`) && TEST_FILE.test(file));

	const REAL_YEAR = /new Date\(\)\.getFullYear\(\)/;
	const CLOCK_BRACKET = /\bconst\s+(?:before|after)\w*\s*=\s*(?:Math\.floor\()?Date\.now\(\)/;

	it("pins the clock rather than reading the year off it or bracketing Date.now()", () => {
		expect(REAL_YEAR.test("year: new Date().getFullYear(),")).toBe(true);
		expect(CLOCK_BRACKET.test("const before = Math.floor(Date.now() / 1000);")).toBe(true);
		expect(unitTests.length).toBeGreaterThan(300);
		expect(unitTests.filter((file) => REAL_YEAR.test(read(file)) || CLOCK_BRACKET.test(read(file)))).toEqual([]);
	});

	const DTO_IMPORT = /from\s+["']@application\/dto\//;
	const DTO_MODULE_MOCK = /vi\.(?:mock|doMock)\(\s*["']@application\/dto\/[a-z]+\/dto["']/;

	it("mocks no DTO module in a unit test, so the real mapping runs over the fixture", () => {
		expect(DTO_MODULE_MOCK.test('vi.mock("@application/dto/payment/dto", () => ({}));')).toBe(true);
		expect(DTO_MODULE_MOCK.test('vi.doMock("@application/dto/region/dto", () => ({}));')).toBe(true);
		expect(DTO_MODULE_MOCK.test('vi.mock("@application/dto/payment/schema", async (importOriginal) => ({}));')).toBe(
			false,
		);
		expect(unitTests.filter((file) => DTO_IMPORT.test(read(file))).length).toBeGreaterThan(40);
		expect(unitTests.filter((file) => DTO_MODULE_MOCK.test(read(file)))).toEqual([]);
	});

	const UNDONE_BY = new Map([
		["stubGlobal", "unstubAllGlobals"],
		["stubEnv", "unstubAllEnvs"],
		["spyOn", "restoreAllMocks"],
		["useFakeTimers", "useRealTimers"],
	]);
	const TEARDOWN_HOOKS = new Set(["afterEach", "afterAll"]);

	const callsIn = (node: ts.Node): ts.CallExpression[] => {
		const found: ts.CallExpression[] = [];
		const visit = (child: ts.Node) => {
			if (ts.isCallExpression(child)) found.push(child);
			ts.forEachChild(child, visit);
		};
		visit(node);
		return found;
	};

	const viMethod = (call: ts.CallExpression): string | undefined =>
		ts.isPropertyAccessExpression(call.expression) &&
		ts.isIdentifier(call.expression.expression) &&
		call.expression.expression.text === "vi"
			? call.expression.name.text
			: undefined;

	const bindingOf = (change: ts.CallExpression): string | undefined => {
		let node: ts.Node = change;
		while (
			(ts.isPropertyAccessExpression(node.parent) || ts.isCallExpression(node.parent)) &&
			node.parent.expression === node
		)
			node = node.parent;
		const { parent } = node;
		if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
		return ts.isBinaryExpression(parent) &&
			parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
			ts.isIdentifier(parent.left)
			? parent.left.text
			: undefined;
	};

	interface UndoesParams {
		scope: ts.Node;
		method: string;
		binding: string | undefined;
	}

	const undoes = ({ scope, method, binding }: UndoesParams) =>
		callsIn(scope).some(
			(call) =>
				viMethod(call) === UNDONE_BY.get(method) ||
				(method === "spyOn" &&
					binding !== undefined &&
					ts.isPropertyAccessExpression(call.expression) &&
					call.expression.name.text === "mockRestore" &&
					call.expression.expression.getText() === binding),
		);

	interface GuardedByFinallyParams {
		change: ts.CallExpression;
		method: string;
		binding: string | undefined;
	}

	const guardedByFinally = ({ change, method, binding }: GuardedByFinallyParams) => {
		for (let node: ts.Node = change; node.parent !== undefined; node = node.parent) {
			const { parent } = node;
			if (
				ts.isTryStatement(parent) &&
				parent.tryBlock === node &&
				parent.finallyBlock !== undefined &&
				undoes({ scope: parent.finallyBlock, method, binding })
			)
				return true;
			if (!ts.isBlock(parent) && !ts.isSourceFile(parent)) continue;
			for (const next of parent.statements.slice(parent.statements.indexOf(node as ts.Statement) + 1)) {
				if (ts.isTryStatement(next) && next.finallyBlock && undoes({ scope: next.finallyBlock, method, binding }))
					return true;
				if (callsIn(next).some((call) => calleeRoot(call.expression) === "expect")) break;
			}
		}
		return false;
	};

	interface UnrestoredChangesParams {
		path: string;
		parsed: ts.SourceFile;
	}

	const unrestoredChanges = ({ path, parsed }: UnrestoredChangesParams) => {
		const calls = callsIn(parsed);
		const hooks = calls.filter((call) => ts.isIdentifier(call.expression) && TEARDOWN_HOOKS.has(call.expression.text));
		return calls.flatMap((change) => {
			const method = viMethod(change);
			if (method === undefined || !UNDONE_BY.has(method)) return [];
			const binding = bindingOf(change);
			const hooked = hooks.some((hook) => {
				const scope = ts.isExpressionStatement(hook.parent) ? hook.parent.parent : hook.parent;
				return (
					(ts.isSourceFile(scope) || (change.pos >= scope.pos && change.end <= scope.end)) &&
					undoes({ scope: hook, method, binding })
				);
			});
			return hooked || guardedByFinally({ change, method, binding })
				? []
				: [`${path}:${parsed.getLineAndCharacterOfPosition(change.getStart(parsed)).line + 1} vi.${method}`];
		});
	};

	it("undoes every stubbed global, stubbed variable, spy and faked clock in an afterEach, an afterAll or a finally around it, which a failing assertion cannot skip", () => {
		const synthetic = ts.createSourceFile(
			"synthetic.test.ts",
			[
				'it("a", () => { vi.stubGlobal("a", 1); expect(a).toBe(1); vi.unstubAllGlobals(); });',
				'it("b", () => { const spy = vi.spyOn(console, "warn"); try { run(); } finally { spy.mockRestore(); } });',
				'describe("c", () => { afterEach(() => { vi.useRealTimers(); }); it("d", () => { vi.useFakeTimers(); }); });',
				'it("e", () => { vi.useFakeTimers(); });',
			].join("\n"),
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		const changed = new Set(unitTests.flatMap((path) => callsIn(parse(path)).flatMap((call) => viMethod(call) ?? [])));

		expect(unrestoredChanges({ path: "synthetic.test.ts", parsed: synthetic })).toEqual([
			"synthetic.test.ts:1 vi.stubGlobal",
			"synthetic.test.ts:4 vi.useFakeTimers",
		]);
		expect([...UNDONE_BY.keys()].filter((method) => !changed.has(method))).toEqual([]);
		expect(unitTests.flatMap((path) => unrestoredChanges({ path, parsed: parse(path) }))).toEqual([]);
	});

	const PROCESS_ENV_WRITE = /\bprocess\.env(?:\.\w+|\[[^\]]+\])\s*=(?!=)|\bdelete\s+process\.env\b/;

	it("varies the environment under test through vi.stubEnv, never by writing to the process environment", () => {
		const testCode = sourceFiles.filter(
			(file) => TEST_FILE.test(file) || file.includes("/e2e/") || file.startsWith("tests/"),
		);

		expect(PROCESS_ENV_WRITE.test(`${["process", "env", "TZ"].join(".")} = "UTC";`)).toBe(true);
		expect(testCode.length).toBeGreaterThan(300);
		expect(testCode.filter((file) => PROCESS_ENV_WRITE.test(read(file)))).toEqual([]);
	});

	interface IssueFreeSafeParsesParams {
		path: string;
		parsed: ts.SourceFile;
	}

	const issueFreeSafeParses = ({ path, parsed }: IssueFreeSafeParsesParams) => {
		const found: string[] = [];
		const visit = (node: ts.Node) => {
			if (
				ts.isCallExpression(node) &&
				ts.isPropertyAccessExpression(node.expression) &&
				node.expression.name.text === "safeParse"
			) {
				const { parent } = node;
				let scope: ts.Node = parent;
				while (!ts.isBlock(scope) && !ts.isSourceFile(scope)) scope = scope.parent;
				const readsIssue =
					(ts.isPropertyAccessExpression(parent) && parent.name.text === "error") ||
					(ts.isVariableDeclaration(parent) &&
						ts.isIdentifier(parent.name) &&
						new RegExp(`\\b${parent.name.text}\\.error\\b`).test(scope.getText(parsed)));
				if (!readsIssue) found.push(`${path}:${parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1}`);
			}
			ts.forEachChild(node, visit);
		};
		visit(parsed);
		return found;
	};

	it("asserts a schema's answer with validate, and keeps safeParse for a case that reads the issue", () => {
		const synthetic = ts.createSourceFile(
			"synthetic.test.ts",
			[
				'it("accepts", () => { expect(schema.safeParse(value).success).toBe(true); });',
				'it("refuses", () => { const result = schema.safeParse(value); expect(result.success).toBe(false); });',
				'it("names", () => { const result = schema.safeParse(value); expect(result.error?.issues[0]?.message).toBe("x"); });',
			].join("\n"),
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);

		expect(issueFreeSafeParses({ path: "synthetic.test.ts", parsed: synthetic })).toEqual([
			"synthetic.test.ts:1",
			"synthetic.test.ts:2",
		]);
		expect(unitTests.flatMap((path) => issueFreeSafeParses({ path, parsed: parse(path) }))).toEqual([]);
	});
});

describe("the colours of apps/web are drawn from the token files", () => {
	const COLOUR_TOKEN_FILES = new Set([
		`${WEB_SRC}/ui/styles/global/index.css`,
		`${WEB_SRC}/ui/styles/theme/index.css`,
		`${WEB_SRC}/ui/styles/palette.ts`,
		`${WEB_SRC}/application/email/palette.ts`,
	]);
	const PALETTE_HUES =
		"slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
	const COLOUR_UTILITIES =
		"bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline|fill|stroke|from|via|to|shadow|decoration|accent|caret|divide|placeholder|inset-ring|inset-shadow|drop-shadow|scrollbar-thumb|scrollbar-track";
	const LITERAL_COLOUR_PATTERNS = [
		/(?<![A-Za-z0-9&/-])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![A-Za-z0-9-])/gi,
		/(?<![A-Za-z0-9-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g,
		new RegExp(
			String.raw`(?<![A-Za-z0-9-])(?:${COLOUR_UTILITIES})-(?:black|white|(?:${PALETTE_HUES})-\d{2,3})(?![A-Za-z0-9-])`,
			"g",
		),
		/(?<![A-Za-z0-9#.-])(?:white|black)(?![A-Za-z0-9-])/g,
	];
	const CSS_NAMED_COLOURS = new Set(
		"aliceblue antiquewhite aqua aquamarine azure beige bisque blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat whitesmoke yellow yellowgreen".split(
			" ",
		),
	);
	const ARBITRARY_PROPERTY_COLOUR = new RegExp(
		String.raw`(?<![A-Za-z0-9-])\[(?:[a-z-]*color|background|fill|stroke):(?:${[...CSS_NAMED_COLOURS].join("|")})(?![A-Za-z0-9-])`,
		"g",
	);
	const STYLE_COLOUR_KEYS = new Set([
		"color",
		"background",
		"backgroundColor",
		"borderColor",
		"outlineColor",
		"fill",
		"stroke",
		"caretColor",
		"accentColor",
		"textDecorationColor",
		"stopColor",
		"floodColor",
		"lightingColor",
		"borderTopColor",
		"borderRightColor",
		"borderBottomColor",
		"borderLeftColor",
		"columnRuleColor",
		"textEmphasisColor",
		"scrollbarColor",
		"fillStyle",
		"strokeStyle",
		"shadowColor",
		"colors",
	]);
	const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
	const CSS_DECLARATION = /([\w-]+)\s*:\s*([^;{}]+)(?=[;}])/g;
	const CSS_VALUE_WORD = /[a-z]+(?:-[a-z]+)*/g;
	const CSS_OPAQUE_VALUE = /var\([^)]*\)|url\([^)]*\)|"[^"]*"|'[^']*'/g;

	interface ColourSitesParams {
		path: string;
		text: string;
	}

	interface ColourMatchesParams {
		text: string;
		lineOf: (index: number) => number;
		path: string;
	}

	const colourMatches = ({ text, lineOf, path }: ColourMatchesParams) =>
		[...LITERAL_COLOUR_PATTERNS, ARBITRARY_PROPERTY_COLOUR].flatMap((pattern) =>
			[...text.matchAll(pattern)].map((match) => `${path}:${lineOf(match.index)} ${match[0]}`),
		);

	const lineNumberOf = (text: string) => (index: number) => text.slice(0, index).split("\n").length;

	const cssColourSites = ({ path, text }: ColourSitesParams) => {
		const stripped = text.replace(CSS_COMMENT, (comment) => comment.replace(/[^\n]/g, " "));
		const lineOf = lineNumberOf(stripped);
		const named = [...stripped.matchAll(CSS_DECLARATION)].flatMap((declaration) =>
			(declaration[2].replace(CSS_OPAQUE_VALUE, " ").match(CSS_VALUE_WORD) ?? [])
				.filter((word) => CSS_NAMED_COLOURS.has(word.toLowerCase()))
				.map((word) => `${path}:${lineOf(declaration.index)} ${word}`),
		);

		return [...colourMatches({ text: stripped, lineOf, path }), ...named];
	};

	interface TsColourSitesParams {
		path: string;
		parsed: ts.SourceFile;
	}

	interface StyleKeyParams {
		node: ts.Node;
		parsed: ts.SourceFile;
	}

	const styleKeyOf = ({ node, parsed }: StyleKeyParams): string => {
		let owner = node;
		while (
			ts.isConditionalExpression(owner.parent) ||
			ts.isParenthesizedExpression(owner.parent) ||
			ts.isAsExpression(owner.parent) ||
			ts.isJsxExpression(owner.parent) ||
			ts.isArrayLiteralExpression(owner.parent) ||
			(ts.isBinaryExpression(owner.parent) && owner.parent.operatorToken.kind !== ts.SyntaxKind.EqualsToken)
		)
			owner = owner.parent;

		const { parent } = owner;
		if (ts.isPropertyAssignment(parent) || ts.isJsxAttribute(parent)) return parent.name.getText(parsed);
		if (ts.isBinaryExpression(parent) && parent.right === owner && ts.isPropertyAccessExpression(parent.left))
			return parent.left.name.text;

		return "";
	};

	const tsColourSites = ({ path, parsed }: TsColourSitesParams) => {
		const found: string[] = [];
		const visit = (node: ts.Node) => {
			const isText =
				ts.isStringLiteral(node) ||
				ts.isNoSubstitutionTemplateLiteral(node) ||
				ts.isTemplateHead(node) ||
				ts.isTemplateMiddle(node) ||
				ts.isTemplateTail(node);
			if (isText && !ts.isImportDeclaration(node.parent) && !ts.isExportDeclaration(node.parent)) {
				const lineOf = () => parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1;
				found.push(...colourMatches({ text: node.text, lineOf, path }));
				const key = styleKeyOf({ node, parsed });
				if (STYLE_COLOUR_KEYS.has(key) && CSS_NAMED_COLOURS.has(node.text.trim().toLowerCase()))
					found.push(`${path}:${lineOf()} ${node.text}`);
			}
			ts.forEachChild(node, visit);
		};
		visit(parsed);
		return found;
	};

	const sourceOf = (path: string) => ({ path, text: read(path) });
	const scanned = [
		...webProduction,
		...trackedFiles.filter((path) => path.startsWith(`${WEB_SRC}/`) && path.endsWith(".css")),
	];
	const sitesIn = (path: string) =>
		path.endsWith(".css") ? cssColourSites(sourceOf(path)) : tsColourSites({ path, parsed: parse(path) });
	const synthetic = (source: string) =>
		tsColourSites({
			path: "synthetic.tsx",
			parsed: ts.createSourceFile("synthetic.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
		});

	it("flags a palette class, a hex, a colour function, a named colour and a CSS keyword, and passes a token", () => {
		expect(synthetic('<p className="text-red-500 bg-white border-black/15 dark:text-green-400" />')).toHaveLength(4);
		expect(synthetic('<p className="bg-[#fff] text-[rgb(0,0,0)] shadow-[0_0_0_2px_#0e0e0e80]" />')).toHaveLength(3);
		expect(synthetic('<p className="bg-[color-mix(in_srgb,var(--a)_10%,white_90%)]" />')).toHaveLength(1);
		expect(synthetic('<p style={{ color: "white", background: "var(--card)" }} />')).toHaveLength(1);
		expect(synthetic('<p style={{ color: "tomato" }} />')).toHaveLength(1);
		expect(synthetic('<svg fill="crimson"><stop stopColor="gold" /></svg>')).toHaveLength(2);
		expect(synthetic('<p style={{ color: alert ? "tomato" : "inherit" }} />')).toHaveLength(1);
		expect(synthetic('<p style={{ color: "inherit" }} data-tone={alert ? "red" : "blue"} />')).toEqual([]);
		expect(synthetic('context.fillStyle = "red"; context.shadowColor = alert ? "gold" : "inherit";')).toHaveLength(2);
		expect(synthetic('element.style.color = "tomato"; element.style.borderTopColor = "teal";')).toHaveLength(2);
		expect(synthetic('element.style.color = "inherit"; element.dataset.tone = "red";')).toEqual([]);
		expect(synthetic('<Confetti colors={["gold", "hotpink"]} tones={["red"]} />')).toHaveLength(2);
		expect(
			synthetic('<p className="[color:red] [background:var(--card)] [fill:currentColor] [mask-type:alpha]" />'),
		).toHaveLength(1);
		expect(cssColourSites({ path: "synthetic.css", text: ".a { color: red; border: 1px solid #fff; }" })).toHaveLength(
			2,
		);
		expect(
			cssColourSites({ path: "synthetic.css", text: ".a { outline: 5000px solid rgba(0, 0, 0, 0.75); }" }),
		).toHaveLength(1);
		expect(
			synthetic(
				'<p className="bg-card text-positive font-black border-divider bg-[var(--wash-teal)] text-(--x)" href="#contact" style={{ color: "inherit", fill: "currentColor", background: "transparent" }} />',
			),
		).toEqual([]);
		expect(
			cssColourSites({
				path: "synthetic.css",
				text: "/* white #fff */ #cc-main { color: var(--card); background: transparent; }",
			}),
		).toEqual([]);
	});

	it("reads a census that holds the real token file's literals", () => {
		const tokenSites = [...COLOUR_TOKEN_FILES].flatMap((path) => sitesIn(path));

		expect(scanned.length).toBeGreaterThan(300);
		expect(scanned.filter((path) => path.endsWith(".css")).length).toBeGreaterThan(5);
		expect(tokenSites.length).toBeGreaterThan(150);
		expect(scanned).toEqual(
			expect.arrayContaining([
				`${WEB_SRC}/application/email/templates/Contact.tsx`,
				`${WEB_SRC}/ui/modules/bones/registry.ts`,
				...COLOUR_TOKEN_FILES,
			]),
		);
	});

	it("draws every colour from the token files, a TSX class, a CSS file or an inline style alike", () => {
		const offenders = scanned.filter((path) => !COLOUR_TOKEN_FILES.has(path)).flatMap((path) => sitesIn(path));

		expect(offenders).toEqual([]);
	});
});

describe("the custom properties of apps/web are declared where something sets them", () => {
	const NAME = "--[A-Za-z0-9_-]+";
	const VAR_READ = new RegExp(String.raw`var\(\s*(${NAME})`, "g");
	const SHORTHAND_READ = new RegExp(String.raw`\(\s*(?:[a-z-]+:)?(${NAME})\s*\)`, "g");
	const BRACKET_READ = new RegExp(String.raw`\[\s*(${NAME})\s*\]`, "g");
	const ARBITRARY_PROPERTY = new RegExp(String.raw`\[(${NAME}):`, "g");
	const CSS_DECLARATION = new RegExp(String.raw`(?<![\w-])(${NAME})\s*:`, "g");
	const PROPERTY_KEY = new RegExp(`^${NAME}$`);
	const THEME_INLINE = /@theme\s+inline\s*\{/g;
	const THEME_ON_DEMAND = /@theme\s*(?:default\s*)?\{/g;
	const THEME_DEFAULT = /@theme\s+default\s*\{/;
	const CSS_MODULE = /\.module\.css$/;
	const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
	const COLOUR_NAMESPACE = /^--color-/;
	const LIBRARY_CSS_VARS = /CssVars\.js$/;
	const LIBRARY_CSS_VAR = new RegExp(`'(${NAME})'`, "g");
	const BASE_UI = `${WEB}/node_modules/@base-ui/react`;
	const TAILWIND_THEME = `${WEB}/node_modules/tailwindcss/theme.css`;

	interface Use {
		name: string;
		at: string;
	}

	interface Uses {
		path: string;
		reads: Use[];
		declarations: Use[];
		unconditional: Use[];
	}

	interface ScanParams {
		path: string;
		text: string;
	}

	interface ReadsInParams {
		path: string;
		text: string;
		lineOf: (index: number) => number;
	}

	const readsIn = ({ path, text, lineOf }: ReadsInParams): Use[] => {
		const seen = new Set<string>();
		return [VAR_READ, SHORTHAND_READ, BRACKET_READ].flatMap((pattern) =>
			[...text.matchAll(pattern)].flatMap((match) => {
				const use = { name: match[1] as string, at: `${path}:${lineOf(match.index)}` };
				const key = `${use.at} ${use.name}`;
				if (seen.has(key)) return [];
				seen.add(key);
				return [use];
			}),
		);
	};

	const lineAt = (text: string) => (index: number) => text.slice(0, index).split("\n").length;

	const blankedLike = (text: string) => text.replace(/[^\n]/g, " ");

	interface ClosingBraceParams {
		css: string;
		open: number;
	}

	const closingBrace = ({ css, open }: ClosingBraceParams) => {
		let depth = 0;
		for (let at = open; at < css.length; at += 1) {
			if (css[at] === "{") depth += 1;
			if (css[at] === "}") depth -= 1;
			if (depth === 0) return at + 1;
		}
		return css.length;
	};

	interface WithoutBlocksParams {
		css: string;
		opener: RegExp;
	}

	const withoutBlocks = ({ css, opener }: WithoutBlocksParams) =>
		[...css.matchAll(opener)]
			.map((match) => (match.index ?? 0) + match[0].length - 1)
			.reduce((text, open) => {
				const close = closingBrace({ css, open });
				return text.slice(0, open) + blankedLike(text.slice(open, close)) + text.slice(close);
			}, css);

	const declarationsOf = ({ path, css }: { path: string; css: string }): Use[] =>
		[...css.matchAll(CSS_DECLARATION)].map((match) => ({
			name: match[1] as string,
			at: `${path}:${lineAt(css)(match.index)}`,
		}));

	const cssUses = ({ path, text }: ScanParams): Uses => {
		const stripped = text.replace(CSS_COMMENT, blankedLike);
		const emitted = withoutBlocks({ css: stripped, opener: THEME_INLINE });
		const always = withoutBlocks({ css: emitted, opener: THEME_ON_DEMAND });
		return {
			path,
			reads: readsIn({ path, text: stripped, lineOf: lineAt(stripped) }),
			declarations: declarationsOf({ path, css: emitted }),
			unconditional: declarationsOf({ path, css: always }),
		};
	};

	const isText = (node: ts.Node) =>
		(ts.isStringLiteral(node) ||
			ts.isNoSubstitutionTemplateLiteral(node) ||
			ts.isTemplateHead(node) ||
			ts.isTemplateMiddle(node) ||
			ts.isTemplateTail(node)) &&
		!ts.isImportDeclaration(node.parent) &&
		!ts.isExportDeclaration(node.parent);

	const tsUses = ({ path, text }: ScanParams): Uses => {
		const parsed = ts.createSourceFile(
			path,
			text,
			ts.ScriptTarget.Latest,
			true,
			path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
		);
		const reads: Use[] = [];
		const declarations: Use[] = [];
		const visit = (node: ts.Node) => {
			const line = parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1;
			const at = `${path}:${line}`;
			if (isText(node)) {
				const literal = (node as ts.StringLiteral).text;
				reads.push(...readsIn({ path, text: literal, lineOf: () => line }));
				declarations.push(
					...[...literal.matchAll(ARBITRARY_PROPERTY)].map((match) => ({ name: match[1] as string, at })),
				);
			}
			if (ts.isPropertyAssignment(node)) {
				const key = ts.isStringLiteralLike(node.name) ? node.name.text : undefined;
				if (key !== undefined && PROPERTY_KEY.test(key)) declarations.push({ name: key, at });
				const font =
					ts.isIdentifier(node.name) && node.name.text === "variable" && ts.isStringLiteralLike(node.initializer);
				if (font && PROPERTY_KEY.test((node.initializer as ts.StringLiteral).text))
					declarations.push({ name: (node.initializer as ts.StringLiteral).text, at });
			}
			if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
				const [first] = node.arguments;
				if (first !== undefined && ts.isStringLiteralLike(first) && PROPERTY_KEY.test(first.text)) {
					if (node.expression.name.text === "setProperty") declarations.push({ name: first.text, at });
					if (node.expression.name.text === "getPropertyValue") reads.push({ name: first.text, at });
				}
			}
			ts.forEachChild(node, visit);
		};
		visit(parsed);
		return { path, reads, declarations, unconditional: declarations };
	};

	const filesUnder = (folder: string): string[] =>
		readdirSync(join(ROOT, folder), { withFileTypes: true }).flatMap((entry) =>
			entry.isDirectory() ? filesUnder(`${folder}/${entry.name}`) : [`${folder}/${entry.name}`],
		);

	const declaredNames = (css: string) => [...css.matchAll(CSS_DECLARATION)].map((match) => match[1] as string);

	const libraryNames = filesUnder(BASE_UI)
		.filter((file) => LIBRARY_CSS_VARS.test(file))
		.flatMap((file) => [...read(file).matchAll(LIBRARY_CSS_VAR)].map((match) => match[1] as string));

	const themeText = read(TAILWIND_THEME);
	const themeOpen = THEME_DEFAULT.exec(themeText);
	const themeBlock = themeOpen
		? themeText.slice(
				themeOpen.index,
				closingBrace({ css: themeText, open: themeOpen.index + themeOpen[0].length - 1 }),
			)
		: "";
	const tailwindNames = declaredNames(themeBlock).filter((name) => !COLOUR_NAMESPACE.test(name));

	const stylesheets = trackedFiles.filter((path) => path.startsWith(`${WEB_SRC}/`) && path.endsWith(".css"));
	const scanned: Uses[] = [
		...webProduction.map((path) => tsUses({ path, text: read(path) })),
		...stylesheets.map((path) => cssUses({ path, text: read(path) })),
	];
	const reads = scanned.flatMap((uses) => uses.reads);
	const sheetNames = stylesheets.flatMap((path) =>
		cssUses({ path, text: read(path) }).declarations.map((use) => use.name),
	);
	const alwaysEmittedSheetNames = stylesheets.flatMap((path) =>
		cssUses({ path, text: read(path) }).unconditional.map((use) => use.name),
	);
	const setterNames = webProduction.flatMap((path) =>
		tsUses({ path, text: read(path) }).declarations.map((use) => use.name),
	);

	const declared = new Set([...sheetNames, ...setterNames, ...libraryNames, ...tailwindNames]);
	const declaredForModules = new Set([...alwaysEmittedSheetNames, ...setterNames, ...libraryNames]);

	interface UndeclaredParams {
		uses: Uses[];
		known: Set<string>;
		knownForModules?: Set<string>;
	}

	const undeclared = ({ uses, known, knownForModules = known }: UndeclaredParams) => {
		const ownAnywhere = new Set(uses.flatMap(({ declarations }) => declarations.map(({ name }) => name)));
		const ownAlways = new Set(uses.flatMap(({ unconditional }) => unconditional.map(({ name }) => name)));
		return uses.flatMap((use) => {
			const inModule = CSS_MODULE.test(use.path);
			const visible = inModule ? knownForModules : known;
			const own = inModule ? ownAlways : ownAnywhere;
			return use.reads
				.filter((read) => !visible.has(read.name) && !own.has(read.name))
				.map((read) => `${read.at} ${read.name}`);
		});
	};

	it("flags a read nothing declares and passes one a stylesheet, a style key, an arbitrary property or a setter declares", () => {
		interface SyntheticParams {
			source?: string;
			css?: string;
		}

		const synthetic = ({ source = "", css = "" }: SyntheticParams) =>
			undeclared({
				uses: [tsUses({ path: "synthetic.tsx", text: source }), cssUses({ path: "synthetic.css", text: css })],
				known: new Set(),
			});
		const inSource = (source: string) => synthetic({ source });
		const inCss = (css: string) => synthetic({ css });

		expect(inSource('<p className="text-[var(--color-brand-paper)] w-(--missing) h-[--legacy]" />')).toEqual([
			"synthetic.tsx:1 --color-brand-paper",
			"synthetic.tsx:1 --missing",
			"synthetic.tsx:1 --legacy",
		]);
		expect(
			synthetic({ source: '<p className="text-[var(--declared)]" />', css: ":root { --declared: red; }" }),
		).toEqual([]);
		expect(inSource('<p style={{ "--tint": tint }} className="bg-(--tint) text-[var(--tint)]" />')).toEqual([]);
		expect(inSource('<p className="[--delay:20s] animate-[spin_var(--delay)_linear]" />')).toEqual([]);
		expect(inSource('node.style.setProperty("--live", "1"); const css = "var(--live)";')).toEqual([]);
		expect(inSource('const font = { variable: "--font-x" }; const css = "var(--font-x)";')).toEqual([]);
		expect(inSource('node.getPropertyValue("--read-by-js")')).toEqual(["synthetic.tsx:1 --read-by-js"]);
		expect(inSource('<p className="w-[calc(var(--a)+(--spacing(4)))]" />')).toEqual(["synthetic.tsx:1 --a"]);
		expect(inCss(".a { width: var(--nowhere); }")).toEqual(["synthetic.css:1 --nowhere"]);
		expect(inCss("@apply scrollbar-thumb-(--thumb);")).toEqual(["synthetic.css:1 --thumb"]);
	});

	it("takes a variable only an @theme inline block declares for undeclared, because Tailwind inlines it and never emits the property", () => {
		const bridged =
			":root { --real: red; }\n@theme inline {\n\t--color-real: var(--real);\n}\n.a { color: var(--color-real); }";

		expect(undeclared({ uses: [cssUses({ path: "synthetic.css", text: bridged })], known: new Set() })).toEqual([
			"synthetic.css:5 --color-real",
		]);
	});

	it("takes a variable only Tailwind's on-demand theme emits for undeclared in a CSS module, which Tailwind never compiles, and for declared in a stylesheet it does", () => {
		const reading = ".a { font-size: var(--text-sm); }";
		const themed = { known: new Set(["--text-sm"]), knownForModules: new Set<string>() };

		expect(undeclared({ uses: [cssUses({ path: "synthetic.module.css", text: reading })], ...themed })).toEqual([
			"synthetic.module.css:1 --text-sm",
		]);
		expect(undeclared({ uses: [cssUses({ path: "synthetic.css", text: reading })], ...themed })).toEqual([]);
	});

	it("counts a name an @theme static block declares for a CSS module, which Tailwind always emits, and not one a plain @theme block declares, which it emits only when a utility uses it", () => {
		const reading = cssUses({ path: "synthetic.module.css", text: ".a { gap: var(--legend-gap); }" });
		const declaring = (css: string) =>
			undeclared({ uses: [reading, cssUses({ path: "synthetic.css", text: css })], known: new Set() });

		expect(declaring("@theme static {\n\t--legend-gap: 1rem;\n}")).toEqual([]);
		expect(declaring("@theme {\n\t--legend-gap: 1rem;\n}")).toEqual(["synthetic.module.css:1 --legend-gap"]);
	});

	it("reads a census that holds every kind of declaration the tree makes", () => {
		expect(webProduction.length).toBeGreaterThan(300);
		expect(stylesheets.length).toBeGreaterThan(5);
		expect(reads.length).toBeGreaterThan(150);
		expect(new Set(sheetNames).size).toBeGreaterThan(150);
		expect(new Set(setterNames).size).toBeGreaterThan(6);
		expect(new Set(libraryNames).size).toBeGreaterThan(30);
		expect(libraryNames).toEqual(
			expect.arrayContaining(["--anchor-width", "--available-height", "--transform-origin"]),
		);
		expect(tailwindNames.length).toBeGreaterThan(80);
		expect(tailwindNames).toEqual(expect.arrayContaining(["--spacing", "--container-7xl", "--text-sm", "--shadow-lg"]));
		expect(tailwindNames.filter((name) => COLOUR_NAMESPACE.test(name))).toEqual([]);
		expect(scanned.filter(({ path }) => CSS_MODULE.test(path)).flatMap(({ reads }) => reads).length).toBeGreaterThan(
			10,
		);
		expect(declaredForModules.size).toBeGreaterThan(150);
	});

	it("declares every custom property a class, a style or a stylesheet reads, in a token file, in the code that sets it or in the library that does", () => {
		expect(undeclared({ uses: scanned, known: declared, knownForModules: declaredForModules })).toEqual([]);
	});
});

describe("the stylesheet apps/web ships is built from the sources it ships", () => {
	const ENTRY = `${WEB_SRC}/ui/styles/index.css`;
	const SOURCE_NOT = /^@source not .*$/gm;
	const NOT_SHIPPED = /\.test\.tsx?$|\.mdx?$|^e2e\//;
	const PALETTE_UTILITY =
		/\.(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|decoration|accent|outline|divide|placeholder)-(?:black|white|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})(?![\w-])/g;
	const tailwind = createRequire(createRequire(join(ROOT, WEB, "package.json")).resolve("@tailwindcss/postcss"));
	const { compile } = tailwind("@tailwindcss/node");
	const { Scanner } = tailwind("@tailwindcss/oxide");

	const built = async (css: string) => {
		const compiler = await compile(css, { base: dirname(join(ROOT, ENTRY)), onDependency() {} });
		const sources = [
			...(compiler.root === null ? [{ base: join(ROOT, WEB), pattern: "**/*", negated: false }] : []),
			...compiler.sources,
		];
		const scanner = new Scanner({ sources });
		const candidates: string[] = scanner.scan();
		const files = (scanner.files as string[]).map((file) => relative(join(ROOT, WEB), file).replace(/\\/g, "/"));

		return { files, css: compiler.build(candidates) as string };
	};

	const entry = read(ENTRY);
	const withoutExclusions = entry.replace(SOURCE_NOT, "");
	const excluded = [...entry.matchAll(/^@source not "([^"]+)";$/gm)].map(([, glob]) => glob as string);

	it("holds a stylesheet that excludes sources, and a build that sees both sides of the exclusion", async () => {
		const [excluding, including] = await Promise.all([built(entry), built(withoutExclusions)]);

		expect((entry.match(SOURCE_NOT) ?? []).length).toBeGreaterThan(0);
		expect(excluded.some((glob) => /\bmd\b/.test(glob) && /\bmdx\b/.test(glob))).toBe(true);
		expect(including.files.filter((file) => NOT_SHIPPED.test(file)).length).toBeGreaterThan(300);
		expect(excluding.files.length).toBeGreaterThan(400);
		expect(excluding.files).toEqual(
			expect.arrayContaining(["src/ui/modules/core/primitives/Button.tsx", "src/app/fonts.ts"]),
		);
		expect((including.css.match(PALETTE_UTILITY) ?? []).length).toBeGreaterThan(0);
	});

	it("scans no test, no end-to-end spec and no Markdown, so a fixture's class names never become shipped rules", async () => {
		const { files } = await built(entry);

		expect(files.filter((file) => NOT_SHIPPED.test(file))).toEqual([]);
	});

	it("emits no palette utility, which only a test fixture or a documented example could have asked for", async () => {
		const { css } = await built(entry);

		expect(css.length).toBeGreaterThan(50_000);
		expect(css.match(PALETTE_UTILITY) ?? []).toEqual([]);
	});
});

describe("the docs site keeps the rules CODING_STANDARDS.md hands to this suite", () => {
	const COMPONENT_PAGES = `${DOCS}/src/content/docs/design-system/components/`;
	const COMPONENT_SECTIONS = ["Props", "Usage", "Conventions", "Accessibility", "In the app"];
	const SECTION_HEADING = /^## (.+)$/gm;
	const LIVE_BADGE = /^\s+badge:\s*\r?\n\s+text: Live$/m;
	const DEMO = "client:visible";

	it("gives every component page its sections in order, after the demos, and the Live badge when it renders one", () => {
		const pages = contentFiles.filter((file) => file.startsWith(COMPONENT_PAGES) && !file.endsWith("/overview.mdx"));
		const offenders = pages.flatMap((file) => {
			const source = read(file);
			const headings = [...source.matchAll(SECTION_HEADING)].map(([, heading = ""]) => heading.trim());
			const fixed = headings.filter((heading) => COMPONENT_SECTIONS.includes(heading));
			const live = source.includes(DEMO);
			return [
				...(fixed.join("|") === COMPONENT_SECTIONS.join("|") &&
				headings.slice(-COMPONENT_SECTIONS.length).join("|") === COMPONENT_SECTIONS.join("|")
					? []
					: [`${file} sections: ${headings.join(", ")}`]),
				...(live && source.lastIndexOf(DEMO) > source.indexOf("\n## Props")
					? [`${file} renders a demo after Props`]
					: []),
				...(live && !LIVE_BADGE.test(source) ? [`${file} renders a demo without the Live badge`] : []),
			];
		});

		expect(pages.length).toBeGreaterThan(15);
		expect(offenders).toEqual([]);
	});

	const propertyKey = (name: ts.PropertyName) =>
		ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : name.getText();

	interface PropertyParams {
		object: ts.ObjectLiteralExpression;
		name: string;
	}

	const property = ({ object, name }: PropertyParams) =>
		object.properties.find(
			(candidate): candidate is ts.PropertyAssignment =>
				ts.isPropertyAssignment(candidate) && propertyKey(candidate.name) === name,
		)?.initializer;

	it("translates every sidebar group into every locale the site serves besides the root", () => {
		const objects: ts.ObjectLiteralExpression[] = [];
		const collect = (node: ts.Node) => {
			if (ts.isObjectLiteralExpression(node)) objects.push(node);
			ts.forEachChild(node, collect);
		};
		collect(parse(`${DOCS}/astro.config.ts`));
		const locales = objects
			.map((object) => property({ object, name: "locales" }))
			.find((value): value is ts.ObjectLiteralExpression => value !== undefined && ts.isObjectLiteralExpression(value));
		const served = (locales?.properties ?? [])
			.flatMap((entry) => (entry.name ? [propertyKey(entry.name)] : []))
			.filter((locale) => locale !== "root");
		const groups = objects.filter(
			(object) =>
				property({ object, name: "label" }) !== undefined && property({ object, name: "items" }) !== undefined,
		);
		const untranslated = groups.flatMap((group) => {
			const translations = property({ object: group, name: "translations" });
			const given =
				translations && ts.isObjectLiteralExpression(translations)
					? translations.properties.flatMap((entry) => (entry.name ? [propertyKey(entry.name)] : []))
					: [];
			const missing = served.filter((locale) => !given.includes(locale));
			return missing.length > 0
				? [`${property({ object: group, name: "label" })?.getText()}: ${missing.join(", ")}`]
				: [];
		});

		expect(served.length).toBeGreaterThan(0);
		expect(groups.length).toBeGreaterThan(5);
		expect(untranslated).toEqual([]);
	});

	const APP_STYLES_ENTRY = `${WEB_SRC}/ui/styles/index.css`;
	const CSS_IMPORT = /@import\s+["']([^"']+)["']/g;

	it("brings the app's styles in through global.css, never the app's own entry point", () => {
		const stylesheets = trackedFiles.filter((file) => file.startsWith(`${DOCS}/`) && file.endsWith(".css"));
		const cssImports = stylesheets.flatMap((file) =>
			[...read(file).matchAll(CSS_IMPORT)].map(([, specifier = ""]) => resolveSpecifier({ from: file, specifier })),
		);
		const codeImports = sourceFiles
			.filter((file) => file.startsWith(`${DOCS}/`))
			.flatMap((file) => importsOf(file).map(({ specifier }) => resolveSpecifier({ from: file, specifier })));

		expect(cssImports.filter((target) => target.startsWith(`${WEB_SRC}/ui/styles/`)).length).toBeGreaterThan(0);
		expect([...cssImports, ...codeImports].filter((target) => target === APP_STYLES_ENTRY)).toEqual([]);
	});

	const CONSENT_CONSTANT = /^export const (ANALYTICS_CATEGORY|\w+_SERVICE_ID) = "([^"]+)";$/gm;
	const consentIdsIn = (file: string) =>
		Object.fromEntries([...read(file).matchAll(CONSENT_CONSTANT)].map(([, name, value]) => [name, value]));

	it("keeps the site's consent category and service ids equal to the app's", () => {
		const app = consentIdsIn(`${WEB_SRC}/ui/modules/shared/cookie-consent/utils/consent.ts`);

		expect(Object.keys(app).length).toBeGreaterThanOrEqual(3);
		expect(consentIdsIn(`${DOCS}/src/lib/analytics/consent.ts`)).toEqual(app);
	});

	const BANNER_WORDS_THE_APP_SHARES = [
		["consentModal.acceptAllBtn", "cookies.acceptAll"],
		["consentModal.acceptNecessaryBtn", "cookies.rejectAll"],
		["preferencesModal.acceptAllBtn", "cookies.acceptAll"],
		["preferencesModal.acceptNecessaryBtn", "cookies.rejectAll"],
		["preferencesModal.title", "cookies.preferencesTitle"],
		["preferencesModal.closeIconLabel", "a11y.closeDialog"],
	] as const;

	interface StringLeavesParams {
		node: ts.Node;
		path?: string;
		out?: Map<string, string>;
	}

	const stringLeaves = ({ node, path = "", out = new Map<string, string>() }: StringLeavesParams) => {
		const below = (key: string) => (path ? `${path}.${key}` : key);
		if (ts.isObjectLiteralExpression(node))
			for (const entry of node.properties.filter(ts.isPropertyAssignment))
				stringLeaves({ node: entry.initializer, path: below(propertyKey(entry.name)), out });
		if (ts.isArrayLiteralExpression(node))
			for (const [index, element] of node.elements.entries())
				stringLeaves({ node: element, path: below(`${index}`), out });
		if (ts.isStringLiteralLike(node)) out.set(path, node.text);
		return out;
	};

	const objectLiteralsIn = (path: string) => {
		const objects: ts.ObjectLiteralExpression[] = [];
		const collect = (node: ts.Node) => {
			if (ts.isObjectLiteralExpression(node)) objects.push(node);
			ts.forEachChild(node, collect);
		};
		collect(parse(path));
		return objects;
	};

	it("speaks every language the site serves in its consent banner, in the app's words for the answers the two share", () => {
		const locales = objectLiteralsIn(`${DOCS}/astro.config.ts`)
			.map((object) => property({ object, name: "locales" }))
			.find((value): value is ts.ObjectLiteralExpression => value !== undefined && ts.isObjectLiteralExpression(value));
		const served = (locales?.properties ?? []).flatMap((entry) => {
			const lang =
				ts.isPropertyAssignment(entry) && ts.isObjectLiteralExpression(entry.initializer)
					? property({ object: entry.initializer, name: "lang" })
					: undefined;
			return lang && ts.isStringLiteralLike(lang) ? [lang.text] : [];
		});
		const translations = objectLiteralsIn(`${DOCS}/src/lib/analytics/consent.ts`).find(
			(object) =>
				ts.isVariableDeclaration(object.parent) &&
				ts.isIdentifier(object.parent.name) &&
				object.parent.name.text === "TRANSLATIONS",
		);
		const languages: readonly ts.ObjectLiteralElementLike[] = translations?.properties ?? [];
		const banner = new Map(
			languages
				.filter(ts.isPropertyAssignment)
				.map((entry) => [propertyKey(entry.name), stringLeaves({ node: entry.initializer })] as const),
		);
		const english = [...(banner.get("en")?.keys() ?? [])].sort();
		const mismatches = [...banner].flatMap(([language, leaves]) => {
			const app = readJson(`${LOCALES_DIR}/${language}.json`);
			const missing = english.filter((key) => !leaves.has(key)).map((key) => `${language} ${key}: missing`);
			const differing = BANNER_WORDS_THE_APP_SHARES.flatMap(([bannerKey, appKey]) => {
				const appWords = appKey.split(".").reduce((value, key) => value?.[key], app);
				return leaves.get(bannerKey) === appWords
					? []
					: [`${language} ${bannerKey}: "${leaves.get(bannerKey)}", the app's ${appKey} says "${appWords}"`];
			});
			return [...missing, ...differing];
		});

		expect(served.length).toBeGreaterThan(1);
		expect(english.length).toBeGreaterThan(BANNER_WORDS_THE_APP_SHARES.length);
		expect([...banner.keys()].sort()).toEqual(served.sort());
		expect(mismatches).toEqual([]);
	});

	const MERMAID_RENDERER = `${DOCS}/src/lib/mermaid-render.ts`;
	const MERMAID_FENCE = /```mermaid\n([\s\S]*?)```/g;
	const MERMAID_FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;
	const MERMAID_DIRECTIVE = /%%\{([\s\S]*?)\}%%/g;
	const LAYOUT_SETTING = /\b(?:layout|defaultRenderer)["']?\s*:\s*["']?([\w-]+)/g;
	const ELK_DIAGRAM = /^\s*flowchart-elk\b/m;

	const fenceLayouts = (fence: string): string[] => [
		...[
			MERMAID_FRONTMATTER.exec(fence)?.[1] ?? "",
			...[...fence.matchAll(MERMAID_DIRECTIVE)].map(([, body = ""]) => body),
		].flatMap((settings) => [...settings.matchAll(LAYOUT_SETTING)].map(([, layout = ""]) => layout)),
		...(ELK_DIAGRAM.test(fence) ? ["elk"] : []),
	];

	it("holds every Mermaid diagram to the layout: dagre it was drawn with, which the renderer sets and no fence overrides", () => {
		const rendererLayouts: string[] = [];
		const collect = (node: ts.Node) => {
			if (ts.isPropertyAssignment(node) && propertyKey(node.name) === "layout")
				rendererLayouts.push(node.initializer.getText());
			ts.forEachChild(node, collect);
		};
		collect(parse(MERMAID_RENDERER));
		const fences = [...markdownFiles, ...contentFiles].flatMap((file) =>
			[...read(file).matchAll(MERMAID_FENCE)].map(([, fence = ""]) => ({ file, fence })),
		);
		const redrawn = fences.flatMap(({ file, fence }) =>
			fenceLayouts(fence)
				.filter((layout) => layout !== "dagre")
				.map((layout) => `${file}: ${layout}`),
		);

		expect(fenceLayouts("---\nconfig:\n  layout: elk\n---\nflowchart LR\n  A --> B\n")).toEqual(["elk"]);
		expect(fenceLayouts('%%{init: {"flowchart": {"defaultRenderer": "elk"}}}%%\nflowchart LR\n')).toEqual(["elk"]);
		expect(fenceLayouts("flowchart-elk TD\n  subgraph layout [x]\n  end\n")).toEqual(["elk"]);
		expect(rendererLayouts).toEqual(['"dagre"']);
		expect(fences.length).toBeGreaterThan(20);
		expect(redrawn).toEqual([]);
	});
});

describe("workflows and package scripts keep the rules CODING_STANDARDS.md hands to this suite", () => {
	const loadYaml = (() => {
		const parser: unknown = ["semantic-release", "cosmiconfig"].reduce(
			(from, name) => createRequire(from.resolve(name)),
			createRequire(join(ROOT, "package.json")),
		)("js-yaml");
		if (typeof parser !== "object" || parser === null || !("load" in parser) || typeof parser.load !== "function")
			throw new Error("js-yaml is out of reach through semantic-release");
		const { load } = parser;
		return (source: string): unknown => load(source);
	})();
	const LOCKFILE = "pnpm-lock.yaml";
	const RENOVATE_FILE = "pnpm-workspace.yaml";
	const yamlFiles = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
		cwd: ROOT,
		encoding: "utf8",
	})
		.split("\n")
		.filter((path) => /\.ya?ml$/.test(path) && path !== LOCKFILE && existsSync(join(ROOT, path)));
	const SHA_PINNED_USES = /^\s*(?:-\s*)?uses:\s*[\w.-]+\/[\w./-]+@[0-9a-f]{40}\s+#\s*\S+$/;
	const USES_LINE = /^\s*(?:-\s*)?uses:\s*(\S+)/;
	const TOOL_DIRECTIVE = /^#\s*(?:zizmor:|yaml-language-server:)/;
	const RENOVATE_LINE = /^# Renovate security update: \S/;

	interface YamlCommentsParams {
		file: string;
		source: string;
	}

	const yamlComments = ({ file, source }: YamlCommentsParams) => {
		const lines = source.split("\n");
		const parsed = loadYaml(source);
		const unchangedWithout = ({ index, column }: { index: number; column: number }) => {
			const without = [...lines.slice(0, index), lines[index]?.slice(0, column).trimEnd(), ...lines.slice(index + 1)];
			try {
				return isDeepStrictEqual(loadYaml(without.join("\n")), parsed);
			} catch {
				return false;
			}
		};
		return lines.flatMap((line, index) => {
			const column = [...line.matchAll(/#/g)]
				.map((match) => match.index)
				.find((at) => (at === 0 || /\s/.test(line[at - 1] ?? "")) && unchangedWithout({ index, column: at }));
			return column === undefined ? [] : [{ file, line: index + 1, text: line, comment: line.slice(column).trim() }];
		});
	};

	interface StringsUnderKeyParams {
		file: string;
		key: string;
	}

	const stringsUnderKey = ({ file, key }: StringsUnderKeyParams) => {
		const found: string[] = [];
		const walk = (value: unknown) => {
			if (Array.isArray(value)) value.forEach(walk);
			else if (value && typeof value === "object")
				for (const [name, child] of Object.entries(value)) {
					if (name === key && typeof child === "string") found.push(child);
					else walk(child);
				}
		};
		walk(loadYaml(read(file)));
		return found;
	};

	it("pins every action and workflow from another repository to a full SHA, its version or branch in a trailing comment", () => {
		const usesLines = yamlFiles.flatMap((file) =>
			read(file)
				.split("\n")
				.flatMap((line, index) => (USES_LINE.test(line) ? [{ file, line: index + 1, text: line }] : [])),
		);
		const parsedUses = yamlFiles.flatMap((file) => stringsUnderKey({ file, key: "uses" }));
		const remote = usesLines.filter(({ text }) => !/^[.$]\//.test(USES_LINE.exec(text)?.[1] ?? ""));
		const unpinned = remote
			.filter(({ text }) => !SHA_PINNED_USES.test(text))
			.map(({ file, line, text }) => `${file}:${line} ${text.trim()}`);

		expect(usesLines.length).toBe(parsedUses.length);
		expect(remote.length).toBeGreaterThan(20);
		expect(unpinned).toEqual([]);
	});

	it("keeps every YAML file free of comments but a pin's version, a tool directive and the line Renovate writes", () => {
		const synthetic = yamlComments({
			file: "synthetic.yml",
			source: 'a: 1 # why\nb: "not # a comment"\nrun: |\n  # shell, not YAML\n  echo\n# heading\nc: 2',
		});
		const comments = yamlFiles.flatMap((file) => yamlComments({ file, source: read(file) }));
		const stray = comments
			.filter(
				({ file, text, comment }) =>
					!SHA_PINNED_USES.test(text) &&
					!TOOL_DIRECTIVE.test(comment) &&
					!(file === RENOVATE_FILE && RENOVATE_LINE.test(text.trim())),
			)
			.map(({ file, line, comment }) => `${file}:${line} ${comment}`);

		expect(synthetic.map(({ line, comment }) => `${line} ${comment}`)).toEqual(["1 # why", "6 # heading"]);
		expect(RENOVATE_LINE.test("# Renovate security update: next@16.3.6 || 16.3.8")).toBe(true);
		expect(yamlFiles.length).toBeGreaterThan(10);
		expect(comments.length).toBeGreaterThan(20);
		expect(stray).toEqual([]);
	});

	it("keeps the shell of every step free of comments, a shebang aside", () => {
		const shells = yamlFiles.flatMap((file) =>
			["run", "command"].flatMap((key) => stringsUnderKey({ file, key }).map((script) => ({ file, script }))),
		);
		const stray = shells.flatMap(({ file, script }) =>
			hashComments({ source: script, multilineStrings: true })
				.filter((comment) => !isShebang(comment))
				.map(({ text }) => `${file}: ${text}`),
		);

		expect(shells.length).toBeGreaterThan(40);
		expect(stray).toEqual([]);
	});

	const PREPARE_ENV = `${COMPOSITE_ACTION_DIR}/prepare-env/action.yml`;
	const TOOLCHAIN_SETUP = /uses:\s*(?:actions\/setup-node|pnpm\/action-setup)@/;
	const FILTERED_INSTALL = /\bpnpm\s+(?:install|i)\b[^\n]*\s(?:--filter|-F)\b/;

	it("sets the toolchain up through prepare-env alone, and installs unfiltered", () => {
		const files = [...workflowFiles, ...compositeActionFiles];

		expect(TOOLCHAIN_SETUP.test(read(PREPARE_ENV))).toBe(true);
		expect(workflowFiles.some((file) => read(file).includes("/.github/actions/prepare-env"))).toBe(true);
		expect({
			setUpElsewhere: files.filter((file) => file !== PREPARE_ENV && TOOLCHAIN_SETUP.test(read(file))),
			filtered: files.filter((file) => FILTERED_INSTALL.test(read(file))),
		}).toEqual({ setUpElsewhere: [], filtered: [] });
	});

	const defaultsWithWorkingDirectory = (workflow: string) => {
		const lines = workflow.split(/\r?\n/);
		return lines.some((line, index) => {
			const opening = /^(\s*)defaults:\s*$/.exec(line);
			if (!opening) return false;
			const indent = opening[1]?.length ?? 0;
			for (const body of lines.slice(index + 1)) {
				if (body.trim().length > 0 && body.length - body.trimStart().length <= indent) return false;
				if (/^\s+working-directory:/.test(body)) return true;
			}
			return false;
		});
	};

	it("scopes a step with its own working-directory, never a defaults block, which does not reach a uses: step", () => {
		expect(defaultsWithWorkingDirectory("jobs:\n  a:\n    defaults:\n      run:\n        working-directory: x\n")).toBe(
			true,
		);
		expect(workflowFiles.some((file) => /^\s+working-directory:/m.test(read(file)))).toBe(true);
		expect(workflowFiles.filter((file) => defaultsWithWorkingDirectory(read(file)))).toEqual([]);
	});

	const scripts = [
		{ manifest: "package.json", scripts: rootScripts },
		{ manifest: `${WEB}/package.json`, scripts: webScripts },
		{ manifest: `${DOCS}/package.json`, scripts: docsScripts },
	].flatMap(({ manifest, scripts: bodies }) =>
		Object.entries(bodies).map(([name, body]) => ({ script: `${manifest} ${name}`, body })),
	);
	const SHELL_SUBSTITUTION = /\$\(|`|\$\{|\$[A-Za-z_]/;
	const CHANGED_ONLY = /--(?:only-)?changed(?![\w-])(?:[ =]([^\s&|;]+))?/g;
	const BIOME_COMMAND = /^(?:pnpm\s+(?:lint|format)\b|biome\b)/;

	it("keeps package scripts free of shell substitution, which means nothing under cmd on Windows, and names a literal base on every changed-only run, since only Biome reads its base from vcs.defaultBranch", () => {
		const changedOnly = scripts.flatMap(({ script, body }) =>
			body
				.split(/&&|\|\|/)
				.map((command) => command.trim())
				.filter((command) => !BIOME_COMMAND.test(command))
				.flatMap((command) => [...command.matchAll(CHANGED_ONLY)].map(([, base]) => ({ script, command, base }))),
		);

		expect(changedOnly.length).toBeGreaterThan(0);
		expect({
			substituted: scripts.filter(({ body }) => SHELL_SUBSTITUTION.test(body)).map(({ script }) => script),
			baseless: changedOnly.filter(({ base }) => !base || base.startsWith("-")).map(({ command }) => command),
		}).toEqual({ substituted: [], baseless: [] });
	});

	const FORWARDED_FLAG = /\bpnpm\s+(?:(?:--filter|-F|--dir|-C)(?:\s+|=)\S+\s+)*(?:run\s+)?[a-z][\w:-]*\s+--\s+-/;

	it("passes Playwright flags through pnpm exec, never after pnpm run <script> --, since flags after the -- reach the script as file filters", () => {
		const bodies = [
			...workflowFiles.map((file) => ({ source: file, body: runCommands(read(file)) })),
			...scripts.map(({ script, body }) => ({ source: script, body })),
		];

		expect(FORWARDED_FLAG.test("pnpm test:e2e -- --grep smoke")).toBe(true);
		expect(bodies.filter(({ body }) => FORWARDED_FLAG.test(body)).map(({ source }) => source)).toEqual([]);
	});
});

describe("the guides describe the project as it is configured", () => {
	const documentedAliases = new Set([...webGuide.matchAll(BACKTICKED_ALIAS)].map(([, alias]) => alias));
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
	const citedScripts = (guide: string) => [
		...new Set(
			pnpmCitations(guide)
				.filter(({ pkg }) => pkg === null)
				.map(({ script }) => script),
		),
	];

	it("cites only root scripts that the root manifest has", () => {
		const cited = citedScripts(rootGuide);

		expect(cited.length).toBeGreaterThan(0);
		expect(cited.filter((script) => !(script in rootScripts))).toEqual([]);
	});

	it.each([
		["README.md", rootScripts],
		[`${WEB}/README.md`, { ...rootScripts, ...webScripts }],
		[`${DOCS}/README.md`, { ...rootScripts, ...docsScripts }],
		[`${DOCS}/AGENTS.md`, { ...rootScripts, ...docsScripts }],
	])("%s cites only scripts a reader could run", (file, available) => {
		const body = readIfPresent(file);

		expect(body).not.toBe("");
		expect(citedScripts(body).filter((script) => !(script in available))).toEqual([]);
	});

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
			const rootGuide = read("AGENTS.md");
			const wiki = read(`${DOCS}/src/content/docs/infra/workflows.mdx`);

			const linked = new RegExp(String.raw`\]\([^)]*\.github/workflows/${escapeForRegExp(name)}\)`);

			expect({ rootGuide: linked.test(rootGuide), wiki: wiki.includes(`## \`${name}\``) }).toEqual({
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
				const deploys =
					DEPLOY_TOOL_COMMAND.test(step) ||
					(step.includes("cloudflare/wrangler-action") && WRANGLER_ACTION_DEPLOY.test(step)) ||
					pnpmCitations(step).some((citation) => DEPLOY_TOOL_COMMAND.test(expandScript({ citation })));
				if (!deploys) continue;
				deploySteps += 1;
				if (step.includes("nick-fields/retry")) wrapped.push(`${file} ->${step.split(/\r?\n/)[0] ?? ""}`);
			}
		}

		expect(deploySteps).toBeGreaterThan(2);
		expect(wrapped).toEqual([]);
	});

	it("names every wrangler deploy with a --message of its own, the sha and the event, so a deployment reads as the commit it shipped", () => {
		const deployLines = workflowFiles.flatMap((file) =>
			read(file)
				.split(/\r?\n/)
				.filter((line) => DEPLOY_TOOL_COMMAND.test(line) || WRANGLER_ACTION_DEPLOY.test(line))
				.map((line) => ({ file, line: line.trim() })),
		);

		expect(deployLines.length).toBeGreaterThan(2);
		expect(
			deployLines.filter(({ line }) => !line.includes("--message")).map(({ file, line }) => `${file} -> ${line}`),
		).toEqual([]);
	});

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
			(deployerConcurrency.group ?? "")
				.replace(GITHUB_WORKFLOW_EXPRESSION, workflowName)
				.replace(GITHUB_REF_EXPRESSION, PULL_REQUEST_MERGE_REF),
		);
		expect(cleanupConcurrency["cancel-in-progress"]).toBe("false");
	});

	it.each([
		["ci.yml", ["verify", "deploy-development", "e2e", "deploy-production", "smoke", "release-web"]],
		["docs.yml", ["build", "preview", "deploy", "smoke", "release-docs"]],
	])("aggregates every gated job of %s under Check, so the preview E2E run gates a merge", (file, gated) => {
		const needs = (read(`${WORKFLOW_DIR}/${file}`).match(AGGREGATE_NEEDS)?.[1] ?? "")
			.split(",")
			.map((job) => job.trim());

		expect(needs).toEqual(expect.arrayContaining(gated));
	});

	it("resolves every filtered pnpm citation against the package it names", () => {
		const sources = [
			"AGENTS.md",
			"README.md",
			".github/CONTRIBUTING.md",
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
		const cited = citedScripts(webGuide);
		const unknown = cited.filter((script) => !(script in webScripts) && !(script in rootScripts));

		expect(cited.length).toBeGreaterThan(0);
		expect(unknown).toEqual([]);
	});

	it("documents every path alias the web tsconfig declares", () => {
		expect(Object.keys(webTsconfigPaths).length).toBeGreaterThan(0);
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

	it("keeps strict on, because next build writes it false when the key is missing", () => {
		expect(webTsconfigOptions.strict).toBe(true);
	});

	it("keeps JavaScript out, because next build writes allowJs true when the key is missing", () => {
		expect(webTsconfigOptions.allowJs).toBe(false);
	});

	it("keeps the generated Cloudflare env types out of the program, where their workerd globals would replace lib.dom's Response, and out of git", () => {
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
		const compiled = entry.replace(/\\/g, "/");
		const unbound = ts
			.getPreEmitDiagnostics(program)
			.filter((diagnostic) => diagnostic.code === UNDECLARED_NAME && diagnostic.file?.fileName === compiled)
			.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));

		expect(program.getSourceFiles().map(({ fileName }) => fileName)).toContain(compiled);
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

	const MACHINE_CODE_PARENT = /(?:^|\.)(?:errors|promoCodeErrors)$/;
	const CAMEL_CASE_KEY = /^[a-z][a-zA-Z0-9]*$/;

	interface CensusParams {
		value: unknown;
		path: string;
		found: { keys: string[]; values: string[] };
	}

	const census = ({ value, path, found }: CensusParams) => {
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			for (const [key, child] of Object.entries(value)) {
				if (!MACHINE_CODE_PARENT.test(path) && !CAMEL_CASE_KEY.test(key)) found.keys.push(`${path}.${key}`);
				census({ value: child, path: path ? `${path}.${key}` : key, found });
			}
		} else if (typeof value !== "string") found.values.push(path);
		return found;
	};

	it("writes every key in camelCase but the machine codes, and every value as a string", () => {
		const breaches = localeFiles.flatMap((file) => {
			const { keys, values } = census({
				value: JSON.parse(read(`${LOCALES_DIR}/${file}`)),
				path: "",
				found: { keys: [], values: [] },
			});
			return [...keys.map((key) => `${file} key ${key}`), ...values.map((path) => `${file} value ${path}`)];
		});

		expect(census({ value: { a_b: [1] }, path: "", found: { keys: [], values: [] } })).toEqual({
			keys: [".a_b"],
			values: ["a_b"],
		});
		expect(breaches).toEqual([]);
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

	const phrasesOf = (phrases: string[]) => new RegExp(`(?<!\\p{L})(?:${phrases.join("|")})(?!\\p{L})`, "iu");

	const RETIRED_COPY: Record<string, RegExp> = {
		"en.json": phrasesOf([
			"days? off",
			"auto-assigned",
			"manually selected",
			"unused days",
			"remaining days",
			"available days",
			"(?:first|last) break",
		]),
		"es.json": phrasesOf([
			"d[ií]as? libres?",
			"d[ií]as? restantes?",
			"d[ií]as? disponibles?",
			"d[ií]as? sin usar",
			"seleccionad[oa]s? manualmente",
			"asignad[oa]s? autom[aá]ticamente",
			"(?:primer|[uú]ltimo) descanso",
		]),
		"ca.json": phrasesOf([
			"di(?:a|es) lliures?",
			"di(?:a|es) restants?",
			"di(?:a|es) disponibles?",
			"dies sense (?:usar|fer servir)",
			"dies que no fas servir",
			"seleccionats? manualment",
			"assignats? autom[aà]ticament",
			"(?:primera|[uú]ltima) pausa",
		]),
		"it.json": phrasesOf([
			"giorn(?:o|i) liber[oi]",
			"giorn(?:o|i) rimanent[ei]",
			"giorn(?:o|i) disponibil[ei]",
			"giorni non usati",
			"selezionat[aeio] manualmente",
			"assegnat[aeio] automaticamente",
			"(?:prima|ultima) pausa",
		]),
		"de.json": phrasesOf([
			"freie[nr]? Tage?",
			"verbleibende[nr]? Tage?",
			"verf[uü]gbare[nr]? Tage?",
			"ungenutzte[nr]? Tage?",
			"manuell ausgew[aä]hlte[nr]?",
			"automatisch zugewiesene[nr]?",
			"(?:erste|letzte) Auszeit",
		]),
		"fr.json": phrasesOf([
			"jours? de repos",
			"jours? restants?",
			"jours? disponibles?",
			"jours? non utilis[ée]s?",
			"s[ée]lectionn[ée]s? manuellement",
			"attribu[ée]s? automatiquement",
			"(?:premi[eè]re|derni[eè]re) pause",
		]),
	};

	const MARKETING_NAMESPACES = new Set(["homepage", "faq", "quickStart", "troubleshooting", "metadata"]);
	const LEGAL_NAMESPACES = new Set(["cookiePolicy", "privacyPolicy", "termsOfService", "legalNotice"]);
	const namespaceOf = (path: string) => path.split(".")[0] ?? "";
	const isProductCopy = (path: string) =>
		!MARKETING_NAMESPACES.has(namespaceOf(path)) && !LEGAL_NAMESPACES.has(namespaceOf(path));

	const RETIRED_COPY_ALLOWED = new Set([
		"en.json error.title",
		"es.json error.title",
		"ca.json error.title",
		"it.json error.title",
		"de.json error.title",
	]);

	it("holds a retired-phrase list for every bundle", () => {
		expect(Object.keys(RETIRED_COPY).sort()).toEqual([...localeFiles].sort());
	});

	it.each(Object.keys(RETIRED_COPY))(
		"%s names no concept by a phrase the glossary retires, outside the marketing and legal copy",
		(file) => {
			const pattern = RETIRED_COPY[file] as RegExp;
			const retired = entriesOf(file)
				.filter(
					([path, value]) => isProductCopy(path) && pattern.test(value) && !RETIRED_COPY_ALLOWED.has(`${file} ${path}`),
				)
				.map(([path, value]) => `${path} -> ${value}`);

			expect(retired).toEqual([]);
		},
	);

	it.each(Object.keys(RETIRED_COPY))(
		"%s still finds those phrases in the marketing copy N1 lets use them, so no list is empty",
		(file) => {
			const pattern = RETIRED_COPY[file] as RegExp;
			const marketing = entriesOf(file).filter(
				([path, value]) => MARKETING_NAMESPACES.has(namespaceOf(path)) && pattern.test(value),
			);

			expect(marketing.length).toBeGreaterThan(0);
		},
	);

	const STYLED_ARGUMENT = /\{\s*\w+\s*,\s*(?:number|date|time)\s*,/;
	const PLAIN_NUMBER_ARGUMENT = /\{\s*\w+\s*,\s*number\s*\}/;

	it.each(localeFiles)(
		"%s styles no number, date or time argument in a message, because production precompiles the bundles and knows no named format",
		(file) => {
			const styled = entriesOf(file)
				.filter(([, value]) => STYLED_ARGUMENT.test(value))
				.map(([path, value]) => `${path} -> ${value}`);

			expect(styled).toEqual([]);
		},
	);

	it("reads the arguments the bundles do hold, so the styled pattern is not blind", () => {
		expect(STYLED_ARGUMENT.test("{pct, number, percent}")).toBe(true);
		expect(STYLED_ARGUMENT.test("{when, date, short}")).toBe(true);
		expect(STYLED_ARGUMENT.test("{amount, number, ::currency/EUR}")).toBe(true);
		expect(STYLED_ARGUMENT.test("({minDays, number}+ days)")).toBe(false);
		expect(entriesOf("en.json").filter(([, value]) => PLAIN_NUMBER_ARGUMENT.test(value)).length).toBeGreaterThan(5);
	});

	it("allows only retired phrases that still stand in the line they excuse", () => {
		const stale = [...RETIRED_COPY_ALLOWED].filter((entry) => {
			const [file = "", path = ""] = entry.split(" ");
			const pattern = RETIRED_COPY[file];
			const found = entriesOf(file).find(([key]) => key === path);
			return !pattern || !found || !pattern.test(found[1]);
		});

		expect(RETIRED_COPY_ALLOWED.size).toBeGreaterThan(0);
		expect(stale).toEqual([]);
	});

	const UPPERCASE_RUN = /(?<![\p{L}\p{N}])\p{Lu}{2,}(?![\p{L}\p{N}])/gu;

	const ACRONYMS = new Set([
		"AEPD",
		"AI",
		"APDCAT",
		"API",
		"CE",
		"CNIL",
		"DSGVO",
		"EE",
		"EEA",
		"EEE",
		"EU",
		"EUA",
		"EWR",
		"FAQ",
		"GDPR",
		"GPDP",
		"HH",
		"HR",
		"HTTPS",
		"IA",
		"ID",
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

const VERSIONED_DEPENDENCIES: Record<string, string[]> = {
	astro: ["Astro"],
	"@astrojs/starlight": ["Starlight"],
	effect: ["Effect"],
	next: ["Next", "Next.js"],
	react: ["React"],
	tailwindcss: ["Tailwind", "Tailwind CSS"],
	typescript: ["TypeScript"],
	wrangler: ["wrangler", "Wrangler"],
	zod: ["Zod", "zod"],
};
const escapeForRegExp = (name: string): string => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const statedVersionPattern = (names: string[]): RegExp =>
	new RegExp(`\\b(?:${names.map(escapeForRegExp).join("|")})\\s+(?:v|@)?\\d+(?:\\.\\d+)*\\b`, "g");
interface PolicedNamesParams {
	readonly declared: Set<string>;
	readonly runtimes: string[];
}
const policedNames = ({ declared, runtimes }: PolicedNamesParams): string[] => [
	...runtimes,
	...Object.entries(VERSIONED_DEPENDENCIES)
		.filter(([dependency]) => declared.has(dependency))
		.flatMap(([, names]) => names),
];
const declaredIn = (manifests: { dependencies?: object; devDependencies?: object }[]): Set<string> =>
	new Set(manifests.flatMap((manifest) => Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })));
const POLICED_NAMES = policedNames({
	declared: declaredIn(["package.json", ...WORKSPACE_PACKAGES.map((pkg) => `${pkg}/package.json`)].map(readJson)),
	runtimes: ["Node", "Node.js", "pnpm"],
});
const STATED_VERSION = statedVersionPattern(POLICED_NAMES);

describe("stated versions", () => {
	it("polices the runtimes and every versioned dependency the manifests declare, and nothing else", () => {
		expect(POLICED_NAMES).toEqual(expect.arrayContaining(["Node", "pnpm"]));
		expect(POLICED_NAMES.length).toBeGreaterThan(2);
	});

	it("states the current version of nothing a bot moves, outside the ADRs", () => {
		const documents = trackedFiles.filter(
			(file) =>
				(file.endsWith(".md") || file.endsWith(".mdx")) && !file.startsWith("adr/") && !file.endsWith("CHANGELOG.md"),
		);
		const stated = documents.flatMap((file) =>
			[...read(file).matchAll(STATED_VERSION)].map(([match]) => `${file}: ${match}`),
		);

		expect(documents.length).toBeGreaterThan(0);
		expect(stated).toEqual([]);
	});
});

const BREAKING_PARSER_OPTS = {
	headerPattern: "^(\\w*)(?:\\((.*)\\))?!?: (.*)$",
	breakingHeaderPattern: "^(\\w*)(?:\\((.*)\\))?!: (.*)$",
};
const COMMIT_PARSING_PLUGINS = ["@semantic-release/commit-analyzer", "@semantic-release/release-notes-generator"];
const RELEASE_CONFIG_PATTERN = /^\.releaserc(\.\w+)?$|^release\.config\./;

type ReleasePlugin = string | [string, Record<string, unknown>?];

interface ParserOptsOfParams {
	plugins: ReleasePlugin[];
	name: string;
}

const parserOptsOf = ({ plugins, name }: ParserOptsOfParams): unknown => {
	const entry = plugins.find((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) === name);

	return Array.isArray(entry) ? entry[1]?.parserOpts : undefined;
};

const releaseConfigs = (): string[] =>
	["", ...readdirSync(join(ROOT, "apps")).map((app) => `apps/${app}`)].flatMap((dir) =>
		readdirSync(join(ROOT, dir || "."))
			.filter((entry) => RELEASE_CONFIG_PATTERN.test(entry))
			.map((entry) => (dir ? `${dir}/${entry}` : entry)),
	);

describe("the release configs parse the commit grammar commitlint accepts", () => {
	const configs = releaseConfigs();

	it("teaches every plugin that parses a commit message the same header grammar, in every package", () => {
		const wrong = configs.flatMap((file) => {
			const { plugins } = readJson(file) as { plugins: ReleasePlugin[] };

			return COMMIT_PARSING_PLUGINS.filter(
				(name) => JSON.stringify(parserOptsOf({ plugins, name })) !== JSON.stringify(BREAKING_PARSER_OPTS),
			).map((name) => `${file}: ${name}`);
		});

		expect(configs.length).toBeGreaterThan(1);
		expect(wrong).toEqual([]);
	});

	const gitMessages = () =>
		configs
			.map((file) => {
				const { plugins } = readJson(file) as { plugins: ReleasePlugin[] };
				const entry = plugins.find(
					(plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) === "@semantic-release/git",
				);

				return { file, app: file.split("/")[1] ?? "", message: Array.isArray(entry) ? String(entry[1]?.message) : "" };
			})
			.filter(({ message }) => message !== "");

	it("serialises every job that pushes a release commit into one concurrency group", () => {
		const groups = ["ci.yml", "docs.yml"].map((workflow) => {
			const body = read(`.github/workflows/${workflow}`);
			const job = body.slice(body.indexOf("  release-"));

			return job.slice(0, job.indexOf("\n    steps:")).match(/^\s*group:\s*(\S+)$/m)?.[1];
		});

		expect(groups).toEqual(["release", "release"]);
	});

	it("writes, versions and commits a changelog wherever it cuts a release", () => {
		const missing = configs.flatMap((file) => {
			const { plugins } = readJson(file) as { plugins: ReleasePlugin[] };
			const names = plugins.map((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin));

			return ["@semantic-release/changelog", "@semantic-release/npm", "@semantic-release/git"]
				.filter((name) => !names.includes(name))
				.map((name) => `${file}: ${name}`);
		});

		expect(configs.length).toBeGreaterThan(1);
		expect(missing).toEqual([]);
	});

	it("commits the release under its own package's scope, and tells CI to leave it alone", () => {
		const wrong = gitMessages().filter(
			({ app, message }) =>
				!message.startsWith(`chore(${app}): release \${nextRelease.version}`) || !message.includes("[skip ci]"),
		);

		expect(gitMessages().length).toBeGreaterThan(0);
		expect(wrong).toEqual([]);
	});
});
