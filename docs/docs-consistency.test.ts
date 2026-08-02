import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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
const GLOSSARY_TERM = /^\*\*(.+?)\*\*:\n(.*)$/gm;
const GLOSSARY_AVOID_LINE = /^_Avoid_:(.*)$/gm;
const GLOSSARY_TERM_WITH_AVOID = /^\*\*(.+?)\*\*:\n(.*)\n_Avoid_:(.*)$/gm;
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
    expect(terms.filter(([, , definition]) => definition.trim().length === 0).map(([, term]) => term)).toEqual([]);
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
  // Quoted text is blanked first so a `https://` in a string is not read as a comment. The check is then
  // position-independent, because trailing, mid-line and JSX `{/* … */}` comments all hid from the
  // line-start version of this rule. A `//` preceded by a backslash is a regex, as in `/^\//`.
  const QUOTED = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
  const LINE_COMMENT = /(^|[^\\])\/\//;
  // QUOTED only spans one line, so a multi-line template literal has to be tracked across lines the way a
  // block comment is: an odd number of surviving backticks opens or closes one. Without this, a URL, an
  // `a//b` or an SQL hint on a continuation line reads as a comment — and an unterminated `/*` there would
  // report the rest of the file. The opening and closing lines are **trimmed at the backtick**, never
  // skipped: the first version of this dropped them whole, and a stray backtick anywhere then switched the
  // rule off for every line below it — silently, which is the one failure an enforcement rule must not have.
  const opensTemplate = (text: string) => (text.match(BACKTICK) ?? []).length % 2 === 1;
  // A regex character class may hold the comment delimiters as literals, as in `/[/*]/`.
  const CHAR_CLASS = /\[(?:[^\]\\]|\\.)*\]/g;
  // Where a comment starts on this line, or -1. Backticks are counted on the code before it only, so a
  // backtick written inside a comment cannot be mistaken for the start of a template literal.
  const commentOpensAt = (text: string) => {
    const line = LINE_COMMENT.exec(text);
    const candidates = [line ? line.index + line[1].length : -1, text.indexOf('/*')].filter((at) => at >= 0);
    return candidates.length > 0 ? Math.min(...candidates) : -1;
  };

  it('leaves the rationale in the folder guides instead', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles.filter((path) => path.startsWith('src/'))) {
      const lines = read(file).split('\n');
      let inBlock = false;
      let inTemplate = false;
      lines.forEach((line, index) => {
        const bare = line.replace(QUOTED, '""').replace(CHAR_CLASS, '[]');
        if (inBlock) {
          if (bare.includes('*/')) inBlock = false;
          else offenders.push(`${file}:${index + 1}`);
          return;
        }
        let rest = bare;
        if (inTemplate) {
          if (!opensTemplate(rest)) return;
          inTemplate = false;
          rest = rest.slice(rest.lastIndexOf('`') + 1);
        }
        const opensAt = commentOpensAt(rest);
        const code = opensAt < 0 ? rest : rest.slice(0, opensAt);
        if (opensTemplate(code)) inTemplate = true;
        if (opensAt < 0) return;
        const comment = rest.slice(opensAt);
        if (comment.startsWith('/*') && !comment.includes('*/')) inBlock = true;
        if (!ALLOWED.test(comment)) offenders.push(`${file}:${index + 1}`);
      });
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

  // TypeScript 7 ships no lib/typescript.js, so Next's compiler-API path throws and `next build` dies
  // before it type-checks anything. The flag is what routes it through the CLI instead.
  it('lets Next reach TypeScript 7 through the CLI', () => {
    expect(read('next.config.ts')).toContain('useTypeScriptCli: true');
  });

  // 7 makes strict its default, so the line looks removable. It is not: `next build` rewrites
  // tsconfig.json on every run and writes `strict: false` whenever the key is absent, which turns strict
  // mode off at the next build rather than at the deletion site.
  it('keeps strict explicit, because next build writes it false when it is missing', () => {
    expect(tsconfigOptions.strict).toBe(true);
  });

  // `include` is `**/*.ts`, so a generated root-level .d.ts joins the program and the workerd globals in it
  // replace lib.dom's Response. Both halves of the guard are asserted because either alone is useless.
  it('keeps the generated Cloudflare env types out of the program and out of git', () => {
    expect(tsconfigExclude).toContain(GENERATED_ENV_TYPES);
    expect(read('.gitignore')).toContain(GENERATED_ENV_TYPES);
  });

  it('declares no compiler option TypeScript 7 removed', () => {
    const removed = ['baseUrl', 'downlevelIteration', 'ignoreDeprecations'];
    expect(removed.filter((option) => option in tsconfigOptions)).toEqual([]);
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
