import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..');
const LAYER_ROOTS = ['src/app', 'src/application', 'src/domain', 'src/infrastructure', 'src/ui'];
const LOCALES_DIR = 'src/ui/i18n/messages';
const ADR_DIR = 'docs/adr';
const ADR_TEMPLATE = '0000-adr-template.md';
// Written by `pnpm cf:typegen`, so it is absent from the tracked tree by design.
const GENERATED_ENV_TYPES = 'cloudflare-env.d.ts';

// `pnpm <word>` occurrences in CLAUDE.md that are not package scripts.
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
const BACKTICKED_ALIAS = /`([^`.]+\/\*)`/g;
const BACKTICK = /`/g;
const CITED_PNPM_SCRIPT = /\bpnpm ([a-z][a-z0-9:-]*)/g;
const ALIAS_WILDCARD_SUFFIX = /\/\*$/;

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
const sourceFiles = trackedFiles.filter((path) => SOURCE_FILE.test(path));
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

const rootGuide = read('CLAUDE.md');
const packageScripts: Record<string, string> = JSON.parse(read('package.json')).scripts ?? {};
const tsconfig = JSON.parse(read('tsconfig.json'));
const tsconfigOptions: Record<string, unknown> = tsconfig.compilerOptions;
const tsconfigExclude: string[] = tsconfig.exclude ?? [];
const tsconfigPaths: Record<string, string[]> = tsconfigOptions.paths as Record<string, string[]>;

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

describe('folder guides exist where they are promised', () => {
  const nestedGuides = markdownFiles.filter((path) => path.startsWith('src/') && path.endsWith('/CLAUDE.md'));

  it.each(LAYER_ROOTS)('%s has a CLAUDE.md', (layer) => {
    expect(existsSync(join(ROOT, layer, 'CLAUDE.md'))).toBe(true);
  });

  // The reverse direction of the link check: a guide the root table forgets will not be read.
  it('lists every nested guide in the root CLAUDE.md table', () => {
    expect(nestedGuides.length).toBeGreaterThan(LAYER_ROOTS.length);
    expect(nestedGuides.filter((path) => !rootGuide.includes(`./${path}`))).toEqual([]);
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
  it('are each linked from a document outside docs/adr/', () => {
    const elsewhere = markdownFiles.filter((path) => !path.startsWith(`${ADR_DIR}/`)).map(read);
    const orphaned = decisions.filter((file) => !elsewhere.some((body) => body.includes(file)));
    expect(orphaned).toEqual([]);
  });
});

describe('documentation does not point at things that are gone', () => {
  const IGNORED_LINK = /^(https?:|mailto:|#|webcal:)/;

  it('resolves every relative markdown link', () => {
    const broken: string[] = [];
    for (const file of markdownFiles) {
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

  it('names only source files that still exist somewhere', () => {
    const exists = (token: string) => sourceFiles.some((path) => path === token || path.endsWith(`/${token}`));

    const missing: string[] = [];
    for (const file of markdownFiles) {
      for (const [, token] of read(file).matchAll(BACKTICKED_SOURCE_FILE)) {
        if (token.includes('*') || token.startsWith('.') || GENERATED.has(token)) continue;
        if (!exists(token)) missing.push(`${file} -> ${token}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('src/ carries no explanatory comments', () => {
  // A suppression changes what the linter does, and a generated file's banner is not ours to delete.
  // Both comment forms count: a11y suppressions on JSX are written `{/* biome-ignore … */}`.
  const ALLOWED = /(?:\/\/|\/\*)\s*(biome-ignore\b|Auto-generated by\b)/;

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

  it('leaves the rationale in the folder guides instead', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles.filter((path) => path.startsWith('src/'))) {
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

describe('CLAUDE.md describes the project as it is configured', () => {
  // Backticked `foo/*` tokens are aliases; the dot filter drops the wrangler route pattern
  // `forever-pto.com/*`. Whole backticked tokens, not substrings: the rule this replaced stripped the
  // `/*` and searched the raw file, so `@app` matched inside `@application` and `src/*` reduced to `src`,
  // and either alias could be deleted from the guide with every assertion still green.
  const documentedAliases = new Set([...rootGuide.matchAll(BACKTICKED_ALIAS)].map(([, alias]) => alias));

  it('documents only package scripts that exist', () => {
    const cited = [...rootGuide.matchAll(CITED_PNPM_SCRIPT)]
      .map(([, script]) => script)
      .filter((script) => !NON_SCRIPT_PNPM.has(script));
    expect([...new Set(cited)].filter((script) => !(script in packageScripts))).toEqual([]);
  });

  it('documents every path alias tsconfig declares', () => {
    expect(Object.keys(tsconfigPaths).filter((alias) => !documentedAliases.has(alias))).toEqual([]);
  });

  it('documents no path alias tsconfig does not declare', () => {
    expect([...documentedAliases].filter((alias) => !(alias in tsconfigPaths))).toEqual([]);
  });

  it('declares no alias pointing at a directory that does not exist', () => {
    const dangling = Object.entries(tsconfigPaths).filter(([, [target]]) => {
      const path = join(ROOT, (target ?? '').replace(ALIAS_WILDCARD_SUFFIX, ''));
      return !existsSync(path) || !statSync(path).isDirectory();
    });
    expect(dangling.map(([alias]) => alias)).toEqual([]);
  });

  // `next build` rewrites tsconfig.json on every run and fills in its own defaults for any key that is
  // absent — `strict: false` and `allowJs: true`. Both would land at the next build rather than at the
  // deletion site, so neither is safe to drop as redundant.
  it('keeps strict on, because next build writes it false when the key is missing', () => {
    expect(tsconfigOptions.strict).toBe(true);
  });

  it('keeps JavaScript out, because next build writes allowJs true when the key is missing', () => {
    expect(tsconfigOptions.allowJs).toBe(false);
  });

  // `include` is `**/*.ts`, so a generated root-level .d.ts joins the program and the workerd globals in it
  // replace lib.dom's Response. Both halves of the guard are asserted because either alone is useless.
  it('keeps the generated Cloudflare env types out of the program and out of git', () => {
    expect(tsconfigExclude).toContain(GENERATED_ENV_TYPES);
    expect(read('.gitignore')).toContain(GENERATED_ENV_TYPES);
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
