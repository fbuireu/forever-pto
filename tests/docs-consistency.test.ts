import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..');
const WEB = 'apps/web';
const DOCS = 'apps/docs';
const WORKSPACE_PACKAGES = [WEB, DOCS];
const PACKAGE_GUIDES = WORKSPACE_PACKAGES.map((pkg) => `${pkg}/CLAUDE.md`);
const LAYER_ROOTS = ['app', 'application', 'domain', 'infrastructure', 'ui'].map((layer) => `${WEB}/src/${layer}`);
const LOCALES_DIR = `${WEB}/src/ui/i18n/messages`;
const ADR_DIR = 'adr';
const ADR_TEMPLATE = '0000-adr-template.md';
// Written by `pnpm cf:typegen` into the web package, so it is absent from the tracked tree by design.
const GENERATED_ENV_TYPES = 'cloudflare-env.d.ts';
const GENERATED_MARKDOWN = new Set([`${WEB}/CHANGELOG.md`]);

// `pnpm <word>` occurrences in a guide that are not package scripts.
const NON_SCRIPT_PNPM = new Set(['install', 'lint-staged', 'commitlint', 'vitest', 'dlx', 'exec']);

const SOURCE_FILE = /\.(ts|tsx)$/;
const CODE_SHAPED_SUFFIX = /\.(ts|tsx|json|md)$/;
const GLOSSARY_TERM = /^\*\*(.+?)\*\*:[ \t]*\n(.*)$/gm;
const GLOSSARY_AVOID_LINE = /^_Avoid_:(.*)$/gm;
const GLOSSARY_TERM_WITH_AVOID = /^\*\*(.+?)\*\*:[ \t]*\n((?:.+\n)*?)_Avoid_:(.*)$/gm;
const ADR_FILENAME = /^\d{4}-[a-z0-9-]+\.md$/;
const ADR_NUMBERED_HEADING = /^# (\d+)\. \S/;
const ADR_DATE_LINE = /^Date: \d{4}-\d{2}-\d{2}$/;
const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const BACKTICKED_TOKEN = /`([^`]+)`/g;
const BACKTICKED_SOURCE_FILE = /`([^`\s]+\.(?:ts|tsx))`/g;
const NESTED_CONTEXT_CITATION = /((?:[\w@-]+\/)+CONTEXT\.md)/g;
const BACKTICKED_ALIAS = /`([^`.]+\/\*)`/g;
const CITED_PNPM_SCRIPT = /\bpnpm ([a-z][a-z0-9:-]*)/g;
const ALIAS_WILDCARD_SUFFIX = /\/\*$/;
const WORKSPACE_PACKAGE_GLOB = /^\s*-\s*['"]?([^'"\s#]+)['"]?\s*$/gm;

// Everything the repo would ship, staged or not, so a rule fires before the offending file is committed.
// Ignored paths and vendored tooling under dotfolders are excluded — they are not ours to fix.
// The index can lie — a stash cycle leaves deleted paths cached — so every entry is confirmed on disk.
const trackedFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  cwd: ROOT,
  encoding: 'utf8',
})
  .split('\n')
  .filter((path) => path.length > 0 && !path.startsWith('.') && existsSync(join(ROOT, path)));

const markdownFiles = trackedFiles.filter((path) => path.endsWith('.md'));
const contentFiles = trackedFiles.filter((path) => path.endsWith('.mdx'));
const authoredMarkdown = markdownFiles.filter((path) => !GENERATED_MARKDOWN.has(path));
const sourceFiles = trackedFiles.filter((path) => SOURCE_FILE.test(path));
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const readIfPresent = (path: string) => (existsSync(join(ROOT, path)) ? read(path) : '');
const readJson = (path: string) => JSON.parse(read(path));

const isGitIgnored = (path: string) => {
  try {
    execFileSync('git', ['check-ignore', '--no-index', '-q', '--', path], { cwd: ROOT });
    return true;
  } catch {
    return false;
  }
};

const rootGuide = read('CLAUDE.md');
const webGuide = readIfPresent(`${WEB}/CLAUDE.md`);
const rootManifest = readJson('package.json');
const rootScripts: Record<string, string> = rootManifest.scripts ?? {};
const webScripts: Record<string, string> = readJson(`${WEB}/package.json`).scripts ?? {};
const webTsconfig = readJson(`${WEB}/tsconfig.json`);
const webTsconfigOptions: Record<string, unknown> = webTsconfig.compilerOptions;
const webTsconfigExclude: string[] = webTsconfig.exclude ?? [];
const webTsconfigPaths: Record<string, string[]> = webTsconfigOptions.paths as Record<string, string[]>;

describe('CONTEXT.md is the domain glossary and nothing else', () => {
  const glossary = read('CONTEXT.md');

  it('lives only at the repo root', () => {
    expect(markdownFiles.filter((path) => path.endsWith('/CONTEXT.md'))).toEqual([]);
  });

  it('is linked from CLAUDE.md so it is discoverable', () => {
    expect(rootGuide).toContain('CONTEXT.md');
  });

  it('carries no file paths, identifiers or call signatures', () => {
    const codeShaped = [...glossary.matchAll(BACKTICKED_TOKEN)]
      .map((match) => match[1])
      .filter((token) => token.includes('/') || token.includes('(') || CODE_SHAPED_SUFFIX.test(token));
    expect(codeShaped).toEqual([]);
  });

  it('gives every term a definition', () => {
    const terms = [...glossary.matchAll(GLOSSARY_TERM)];
    expect(terms.length).toBeGreaterThan(0);
    const undefined_ = terms.filter(([, , definition]) => {
      const text = definition.trim();
      return text.length === 0 || text.startsWith('_Avoid_:');
    });
    expect(undefined_.map(([, term]) => term)).toEqual([]);
  });

  it('never leaves an _Avoid_ list empty', () => {
    const empty = [...glossary.matchAll(GLOSSARY_AVOID_LINE)].filter(([, list]) => list.trim().length === 0);
    expect(empty).toEqual([]);
  });

  it('never lists a term as its own alternative', () => {
    const selfAvoiding: string[] = [];
    for (const [, term, , avoided] of glossary.matchAll(GLOSSARY_TERM_WITH_AVOID)) {
      const alternatives = avoided.split(',').map((entry) => entry.trim().toLowerCase());
      if (alternatives.includes(term.toLowerCase())) selfAvoiding.push(term);
    }
    expect(selfAvoiding).toEqual([]);
  });
});

describe('the workspace is shaped the way the guides describe it', () => {
  const workspaceGlobs = [...read('pnpm-workspace.yaml').matchAll(WORKSPACE_PACKAGE_GLOB)].map(([, glob]) => glob);

  it('declares package globs that match a directory holding a manifest', () => {
    const dangling = workspaceGlobs.filter((glob) => {
      const [base] = glob.split('/*');
      return !existsSync(join(ROOT, base ?? '')) || !statSync(join(ROOT, base ?? '')).isDirectory();
    });
    expect(dangling).toEqual([]);
  });

  it.each(WORKSPACE_PACKAGES)('%s is a workspace member with its own manifest', (pkg) => {
    expect(existsSync(join(ROOT, pkg, 'package.json'))).toBe(true);
    expect(workspaceGlobs.some((glob) => pkg.startsWith(glob.replace(/\*$/, '')))).toBe(true);
  });

  it.each(WORKSPACE_PACKAGES)('%s explains itself to a human and to an agent', (pkg) => {
    expect(existsSync(join(ROOT, pkg, 'README.md'))).toBe(true);
    expect(existsSync(join(ROOT, pkg, 'CLAUDE.md'))).toBe(true);
    expect(read('README.md')).toContain(`(${pkg}/README.md)`);
  });

  it('keeps the root private, unversioned and dependency-free', () => {
    expect(rootManifest.private).toBe(true);
    expect(rootManifest.version).toBe('0.0.0');
    expect(rootManifest.dependencies).toBeUndefined();
  });

  it.each(WORKSPACE_PACKAGES)('%s carries no biome config and no lockfile of its own', (pkg) => {
    expect(existsSync(join(ROOT, pkg, 'biome.json'))).toBe(false);
    expect(existsSync(join(ROOT, pkg, 'pnpm-lock.yaml'))).toBe(false);
  });

  it("resolves every repo-relative path biome's includes list excludes", () => {
    const includes: string[] = readJson('biome.json').files.includes;
    const dangling = includes
      .filter((entry) => entry.startsWith('!') && !entry.includes('*'))
      .map((entry) => entry.slice(1))
      .filter((path) => !existsSync(join(ROOT, path)));
    expect(dangling).toEqual([]);
  });

  it('keeps the web tsconfig beside the next config it is rewritten by', () => {
    expect(existsSync(join(ROOT, WEB, 'next.config.ts'))).toBe(true);
    expect(existsSync(join(ROOT, WEB, 'tsconfig.json'))).toBe(true);
  });
});

describe('folder guides exist where they are promised', () => {
  const nestedGuides = markdownFiles.filter((path) => path !== 'CLAUDE.md' && path.endsWith('CLAUDE.md'));
  const webSrcGuides = nestedGuides.filter((path) => path.startsWith(`${WEB}/src/`));

  it.each(LAYER_ROOTS)('%s has a CLAUDE.md', (layer) => {
    expect(existsSync(join(ROOT, layer, 'CLAUDE.md'))).toBe(true);
  });

  it.each(PACKAGE_GUIDES)('%s exists', (guide) => {
    expect(existsSync(join(ROOT, guide))).toBe(true);
  });

  // The reverse direction of the link check, in two levels: a guide no index points at will not be read.
  it('lists every package guide in the root CLAUDE.md', () => {
    expect(PACKAGE_GUIDES.filter((guide) => !rootGuide.includes(`./${guide}`))).toEqual([]);
  });

  it('lists every web source guide in the apps/web CLAUDE.md table', () => {
    expect(webSrcGuides.length).toBeGreaterThan(LAYER_ROOTS.length);
    const missing = webSrcGuides.filter((path) => !webGuide.includes(`./${path.slice(`${WEB}/`.length)}`));
    expect(missing).toEqual([]);
  });

  // The heading is the guide's only self-identification; a wrong one sends a reader to another folder.
  it('titles every nested guide with its own folder path, then a body', () => {
    const malformed = nestedGuides.filter((path) => {
      const [heading, , body] = read(path).split('\n');
      return heading !== `# ${dirname(path)}` || !body?.trim();
    });
    expect(malformed).toEqual([]);
  });
});

describe('architecture decision records', () => {
  const adrs = readdirSync(join(ROOT, ADR_DIR)).filter((file) => file.endsWith('.md'));
  const decisions = adrs.filter((file) => file !== ADR_TEMPLATE);

  it('ships the template the contract tells you to copy', () => {
    expect(adrs).toContain(ADR_TEMPLATE);
  });

  it('are all named NNNN-slug.md', () => {
    expect(adrs.filter((file) => !ADR_FILENAME.test(file))).toEqual([]);
  });

  it('are numbered contiguously from 0001', () => {
    const numbers = decisions.map((file) => Number(file.slice(0, 4))).sort((a, b) => a - b);
    expect(numbers).toEqual(numbers.map((_, index) => index + 1));
  });

  it('carry every section of the template', () => {
    const incomplete: string[] = [];
    for (const file of adrs) {
      const body = read(`${ADR_DIR}/${file}`);
      const missing = ['## Status', '## Context', '## Decision', '## Consequences'].filter(
        (section) => !body.includes(`\n${section}\n`)
      );
      if (missing.length > 0) incomplete.push(`${file} -> ${missing.join(', ')}`);
    }
    expect(incomplete).toEqual([]);
  });

  it('open with a numbered title matching the filename, then a date', () => {
    const malformed: string[] = [];
    for (const file of adrs) {
      const [heading = '', blank, date = ''] = read(`${ADR_DIR}/${file}`).split('\n');
      const numbered = ADR_NUMBERED_HEADING.exec(heading);
      if (!numbered || Number(numbered[1]) !== Number(file.slice(0, 4))) {
        malformed.push(`${file} -> heading: ${heading}`);
        continue;
      }
      if (blank !== '' || !ADR_DATE_LINE.test(date)) malformed.push(`${file} -> date: ${date}`);
    }
    expect(malformed).toEqual([]);
  });

  // An ADR only its own folder points at will not be read.
  it('are each linked from a document outside adr/', () => {
    const elsewhere = authoredMarkdown.filter((path) => !path.startsWith(`${ADR_DIR}/`)).map(read);
    const orphaned = decisions.filter((file) => !elsewhere.some((body) => body.includes(file)));
    expect(orphaned).toEqual([]);
  });
});

describe('documentation does not point at things that are gone', () => {
  const IGNORED_LINK = /^(https?:|mailto:|#|webcal:)/;

  it('resolves every relative markdown link', () => {
    const broken: string[] = [];
    for (const file of authoredMarkdown) {
      for (const [, , target] of read(file).matchAll(MARKDOWN_LINK)) {
        if (IGNORED_LINK.test(target)) continue;
        const [path] = target.split('#');
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
        if (token.includes('*') || token.startsWith('.') || GENERATED.has(token)) continue;
        if (!exists(token)) missing.push(`${file} -> ${token}`);
      }
    }
    return missing;
  };

  it('names only source files that still exist somewhere', () => {
    expect(citedSourceFiles(authoredMarkdown)).toEqual([]);
  });

  it('names only source files that still exist, in the published wiki too', () => {
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
  it('never teaches a nested CONTEXT.md, which the root guide forbids', () => {
    const offenders: string[] = [];
    for (const file of [...authoredMarkdown, ...contentFiles]) {
      for (const [, token] of read(file).matchAll(NESTED_CONTEXT_CITATION)) {
        offenders.push(`${file} -> ${token}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  // The wiki's copy-pasteable Usage blocks are the largest slice of the cross-package seam and the only
  // one nothing checked: `astro check` registers no MDX plugin, and the citation rules above match file
  // paths rather than exported symbols. A rename in apps/web silently published a wrong import.
  it('imports only symbols apps/web still exports, in the published wiki fences', () => {
    const FENCE = /```(?:tsx?|ts)\n([\s\S]*?)```/g;
    const UI_IMPORT = /import\s*\{([^}]+)\}\s*from\s*'(@ui\/[^']+)'/g;

    const exportsOf = (specifier: string): Set<string> | null => {
      const base = join(ROOT, 'apps/web/src/ui', specifier.replace('@ui/', ''));
      const path = [`${base}.tsx`, `${base}.ts`].find((candidate) => existsSync(candidate));
      if (!path) return null;

      const source = readFileSync(path, 'utf8');
      const names = new Set<string>();

      for (const [, name] of source.matchAll(
        /export\s+(?:declare\s+)?(?:const|let|function|class|interface|type|enum)\s+(\w+)/g
      )) {
        names.add(name);
      }
      for (const [, group] of source.matchAll(/export\s*\{([^}]+)\}/g)) {
        for (const entry of group.split(',')) {
          const alias = entry
            .trim()
            .split(/\s+as\s+/)
            .at(-1);
          if (alias) names.add(alias.replace(/^type\s+/, '').trim());
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
          for (const name of names.split(',').map((entry) => entry.replace(/^type\s+/, '').trim())) {
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

  it('prints repo-relative paths in the published wiki, never package-relative ones', () => {
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

describe('apps/web/src carries no explanatory comments', () => {
  // A suppression changes what the linter does, and a generated file's banner is not ours to delete.
  // Both comment forms count: a11y suppressions on JSX are written `{/* biome-ignore … */}`.
  const ALLOWED = /(?:\/\/|\/\*)\s*(biome-ignore\b|Auto-generated by\b)/;
  const webSources = sourceFiles.filter((path) => path.startsWith(`${WEB}/src/`));

  // This parses the file rather than matching comment delimiters by hand. Four hand-rolled versions were
  // written and every one was wrong somewhere: a URL inside a multi-line template read as a comment; a stray
  // backtick switched the rule off for the rest of the file; an escaped backtick did the same by flipping a
  // parity count; a character class swallowed the delimiter it was meant to protect. JavaScript's lexical
  // grammar is not a regular language. Scanning alone is not enough either — only the parser knows whether a
  // slash opens a regex or divides, which is why `/^\//` in images/loader.ts reads as a comment to a bare
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

  it('has app sources to check at all', () => {
    expect(webSources.length).toBeGreaterThan(100);
  });

  it('leaves the rationale in the folder guides instead', () => {
    const offenders: string[] = [];
    for (const file of webSources) {
      const source = read(file);
      // parsing every file is what made this rule time out under parallel load; a file holding neither
      // delimiter anywhere cannot hold a comment, and that is most of them
      if (!source.includes('//') && !source.includes('/*')) continue;

      for (const { line, text } of commentsIn(file, source)) {
        if (!ALLOWED.test(text)) offenders.push(`${file}:${line}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('the guides describe the project as it is configured', () => {
  // Backticked `foo/*` tokens are aliases; the dot filter drops the wrangler route pattern
  // `forever-pto.com/*`. Whole backticked tokens, not substrings: the rule this replaced stripped the
  // `/*` and searched the raw file, so `@app` matched inside `@application` and `src/*` reduced to `src`,
  // and either alias could be deleted from the guide with every assertion still green.
  const documentedAliases = new Set([...webGuide.matchAll(BACKTICKED_ALIAS)].map(([, alias]) => alias));
  const citedScripts = (guide: string) =>
    [...new Set([...guide.matchAll(CITED_PNPM_SCRIPT)].map(([, script]) => script))].filter(
      (script) => !NON_SCRIPT_PNPM.has(script)
    );

  it('cites only root scripts that the root manifest has', () => {
    expect(citedScripts(rootGuide).filter((script) => !(script in rootScripts))).toEqual([]);
  });

  // A README is where someone copies a command from, so a script it names has to exist somewhere
  // a reader could run it: the root, or the package the README belongs to.
  it.each([
    ['README.md', rootScripts],
    [`${WEB}/README.md`, { ...rootScripts, ...webScripts }],
    [`${DOCS}/README.md`, { ...rootScripts, ...readJson(`${DOCS}/package.json`).scripts }],
  ])('%s cites only scripts a reader could run', (file, available) => {
    expect(citedScripts(readIfPresent(file)).filter((script) => !(script in available))).toEqual([]);
  });

  it('cites only web scripts that resolve in the web or root manifest', () => {
    const unknown = citedScripts(webGuide).filter((script) => !(script in webScripts) && !(script in rootScripts));
    expect(unknown).toEqual([]);
  });

  it('documents every path alias the web tsconfig declares', () => {
    expect(Object.keys(webTsconfigPaths).filter((alias) => !documentedAliases.has(alias))).toEqual([]);
  });

  it('documents no path alias the web tsconfig does not declare', () => {
    expect([...documentedAliases].filter((alias) => !(alias in webTsconfigPaths))).toEqual([]);
  });

  it('declares no alias pointing at a directory that does not exist', () => {
    const dangling = Object.entries(webTsconfigPaths).filter(([, [target]]) => {
      const path = resolve(ROOT, WEB, (target ?? '').replace(ALIAS_WILDCARD_SUFFIX, ''));
      return !existsSync(path) || !statSync(path).isDirectory();
    });
    expect(dangling.map(([alias]) => alias)).toEqual([]);
  });

  // `next build` rewrites apps/web/tsconfig.json on every run and fills in its own defaults for any key
  // that is absent — `strict: false` and `allowJs: true`. Both would land at the next build rather than at
  // the deletion site, so neither is safe to drop as redundant.
  it('keeps strict on, because next build writes it false when the key is missing', () => {
    expect(webTsconfigOptions.strict).toBe(true);
  });

  it('keeps JavaScript out, because next build writes allowJs true when the key is missing', () => {
    expect(webTsconfigOptions.allowJs).toBe(false);
  });

  // `include` is `**/*.ts`, so a generated .d.ts at the package root joins the program and the workerd
  // globals in it replace lib.dom's Response. Both halves of the guard are asserted because either alone
  // is useless. The ignore half is asked of git rather than matched against .gitignore as a substring,
  // so an unanchored pattern that stops covering the file is caught.
  it('keeps the generated Cloudflare env types out of the program and out of git', () => {
    expect(webTsconfigExclude).toContain(GENERATED_ENV_TYPES);
    expect(isGitIgnored(`${WEB}/${GENERATED_ENV_TYPES}`)).toBe(true);
  });
});

describe('translation bundles stay in step', () => {
  const localeFiles = readdirSync(join(ROOT, LOCALES_DIR)).filter((file) => file.endsWith('.json'));
  const flatten = (value: unknown, path = '', out: string[] = []) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) flatten(child, path ? `${path}.${key}` : key, out);
    } else out.push(path);
    return out;
  };
  const keysOf = (file: string) => flatten(JSON.parse(read(`${LOCALES_DIR}/${file}`))).sort();
  const reference = keysOf('en.json');

  it('ships more than one locale', () => {
    expect(localeFiles.length).toBeGreaterThan(1);
  });

  it.each(localeFiles.filter((file) => file !== 'en.json'))('%s has exactly the keys en.json has', (file) => {
    const keys = keysOf(file);
    expect({
      missing: reference.filter((key) => !keys.includes(key)),
      extra: keys.filter((key) => !reference.includes(key)),
    }).toEqual({ missing: [], extra: [] });
  });
});
