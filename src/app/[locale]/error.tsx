'use client';

import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { Button } from '@ui/modules/core/primitives/Button';
import { Navigation } from '@ui/modules/pages/homepage/navigation/Navigation';
import { Footer } from '@ui/modules/shared/footer/Footer';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { version } from '../../../package.json';

const ContactModal = dynamic(() =>
  import('@ui/modules/shared/contact/ContactModal').then((m) => ({ default: m.ContactModal }))
);

const logger = getBetterStackInstance();
const STATUS_URL = 'https://status.forever-pto.com';
const CHANGELOG_URL = 'https://github.com/fbuireu/forever-pto/releases';
const SUPPORT_URL = 'https://github.com/fbuireu/forever-pto/issues/new?template=bug_report.yml';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'OK';

const LEVEL_COLORS: Record<LogLevel, string> = {
  INFO: 'var(--color-brand-teal)',
  WARN: 'var(--color-brand-yellow)',
  ERROR: 'var(--color-brand-red)',
  OK: 'var(--color-brand-green)',
};

const LOG_LINE_REGEX = /^(\[\d{2}:\d{2}:\d{2}\])\s+(INFO|WARN|ERROR|OK)\s+(.*)$/;

function TerminalLine({ line }: { line: string }) {
  const m = line.match(LOG_LINE_REGEX);
  if (m) {
    const [, ts, level, rest] = m;
    return (
      <div>
        <span className='text-[#666]'>{ts} </span>
        <span className='font-bold inline-block min-w-[3.5em]' style={{ color: LEVEL_COLORS[level as LogLevel] }}>
          {level}
        </span>
        {rest}
      </div>
    );
  }

  if (line.startsWith('💥')) {
    return (
      <span className='inline-flex items-center gap-1.5 border border-[var(--color-brand-red)] rounded px-1.5 py-0.5 text-[var(--color-brand-red)] text-[12px]'>
        {line}
      </span>
    );
  }

  if (line.startsWith('  at ')) {
    return <div className='text-[#666]'>{line}</div>;
  }

  if (line === '---') return <div className='text-[#444]'>---</div>;

  if (line.startsWith('$ ')) {
    const content = line.slice(2);
    const hasCursor = content.endsWith(' _');
    const text = hasCursor ? content.slice(0, -2) : content;
    return (
      <div>
        <span className='text-[var(--color-brand-teal)]'>$ </span>
        {text}
        {hasCursor && (
          <span className='inline-block w-[0.5em] h-[1em] bg-[var(--color-brand-yellow)] align-text-bottom ml-[2px] [animation:term-blink_1s_steps(2,start)_infinite]' />
        )}
      </div>
    );
  }

  if (line === '') return <div className='h-[1.4em]' />;
  return <div>{line}</div>;
}

const LINE_DELAY_MS = 130;

export default function ErrorPage({ error, reset }: ErrorProps) {
  const t = useTranslations('error');
  const [contactOpen, setContactOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const capturedAt = useRef(new Date());
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logger.logError('Unhandled error caught by error boundary', error, {
      component: 'ErrorPage',
      digest: error.digest,
    });
  }, [error]);

  const ts = [
    capturedAt.current.getUTCHours().toString().padStart(2, '0'),
    capturedAt.current.getUTCMinutes().toString().padStart(2, '0'),
    capturedAt.current.getUTCSeconds().toString().padStart(2, '0'),
  ].join(':');
  const year = capturedAt.current.getFullYear();

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally frozen at mount — terminal is a one-shot snapshot of the error
  const traceLines = useMemo(
    () => [
      `[${ts}] INFO  calc-engine: computing bridges for ${year}`,
      `[${ts}] INFO  loaded holidays · ratio target 3.5x`,
      `[${ts}] WARN  calendar-sync: rate limit close (external API)`,
      `[${ts}] WARN  retry #1 · backoff 400ms`,
      `[${ts}] ERROR unexpected <palm/> token`,
      `[${ts}] ERROR ${error.message || t('internalServerError')}`,
      ``,
      `  at calcBridges (vacation-optimizer.ts:127:14)`,
      `  at Object.computePlan (engine.ts:48:22)`,
      `  at async handler (api/bridges.ts:31:9)`,
      ...(error.stack ? [``, ...error.stack.split('\n')] : []),
      ``,
      `💥 HTTP 500 — caught`,
      ``,
      `[${ts}] OK    alerting on-call · #ops-urgent`,
      `[${ts}] OK    fallback → cached plan (stale 12m)`,
      `---`,
      `$ ${t('terminalPrompt')}`,
    ],
    []
  );

  useEffect(() => {
    if (visibleCount >= traceLines.length) return;
    const id = setTimeout(() => setVisibleCount((c) => c + 1), LINE_DELAY_MS);
    return () => clearTimeout(id);
  }, [visibleCount, traceLines.length]);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  return (
    <div className='min-h-screen flex flex-col text-foreground bg-background'>
      <Navigation />

      <main
        className='flex-1 py-[60px]'
        style={{
          background: [
            'linear-gradient(0deg, transparent 95%, rgba(0,0,0,.04) 95%)',
            'linear-gradient(90deg, transparent 95%, rgba(0,0,0,.04) 95%)',
            'var(--background)',
          ].join(', '),
          backgroundSize: '32px 32px',
        }}
      >
        <div className='max-w-[1320px] mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-[60px] px-7 items-center'>
          <div className='flex flex-col'>
            <div className='flex items-start gap-[10px] mb-[26px] font-display font-extrabold tracking-[-0.06em] leading-[0.82] text-[clamp(90px,13vw,200px)]'>
              <span className='inline-block bg-[var(--color-brand-orange)] text-white border-[5px] border-[var(--frame)] rounded-[18px] px-[0.2em] pb-[0.17em] pt-[0.03em] shadow-[10px_10px_0_0_var(--frame)] leading-[0.85]'>
                5
              </span>
              <span className='inline-block bg-[var(--accent)] border-[5px] border-[var(--frame)] rounded-[18px] px-[0.2em] pb-[0.17em] pt-[0.03em] shadow-[10px_10px_0_0_var(--frame)] leading-[0.85]'>
                0
              </span>
              <span className='inline-block bg-[var(--color-brand-teal)] border-[5px] border-[var(--frame)] rounded-[18px] px-[0.2em] pb-[0.17em] pt-[0.03em] shadow-[10px_10px_0_0_var(--frame)] leading-[0.85]'>
                0
              </span>
            </div>

            <span className='inline-flex items-center gap-2 self-start bg-destructive text-white px-3 py-1.5 rounded-[6px] font-mono text-[11px] font-bold tracking-[0.12em] uppercase mb-[14px]'>
              <span className='w-2 h-2 rounded-full bg-[var(--accent)]' />
              {t('kicker', { version, time: ts })}
            </span>

            <h1 className='font-display font-extrabold leading-none tracking-[-0.035em] mb-[18px] text-wrap-pretty text-[clamp(28px,3.8vw,48px)]'>
              {t('title')}{' '}
              <span className='relative inline-block bg-[var(--color-brand-orange)] text-white px-2 border-[3px] border-[var(--frame)] rounded-[6px] mx-0.5 [animation:highlight-shake_4s_ease-in-out_infinite_1.5s]'>
                {t('titleHighlight')}
              </span>{' '}
              <em className='font-serif italic font-normal'>{t('titleEmphasis')}</em>
            </h1>

            <p className='text-[18px] leading-[1.55] text-muted-foreground max-w-[46ch] mb-8'>{t('lede')}</p>

            <div className='flex flex-wrap gap-[14px] mb-9'>
              <Button variant='default' size='lg' onClick={reset}>
                <RotateCcw className='h-4 w-4' />
                {t('retry')}
              </Button>
              <Button variant='outline' size='lg' asChild>
                <a href={STATUS_URL} target='_blank' rel='noopener noreferrer'>
                  {t('statusPage')}
                  <ArrowUpRight className='h-4 w-4' />
                </a>
              </Button>
            </div>

            <div className='border-t-2 border-dashed border-[var(--frame)] pt-[22px] max-w-[520px]'>
              <span className='block font-mono text-[11px] font-bold text-muted-foreground tracking-[0.12em] uppercase mb-3'>
                {t('meanwhile')}
              </span>
              <div className='flex flex-col gap-2'>
                <button
                  type='button'
                  onClick={() => setContactOpen(true)}
                  className='flex items-center gap-2.5 px-3 py-2.5 bg-card border-[2px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] text-foreground text-[13px] font-semibold transition-[transform,box-shadow] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--frame)] cursor-pointer'
                >
                  <span className='shrink-0 w-6 h-6 bg-[var(--color-brand-purple)] text-white border-[2px] border-[var(--frame)] rounded-[6px] grid place-items-center text-[13px] font-extrabold'>
                    @
                  </span>
                  {t('contact')}
                </button>
                <a
                  href={CHANGELOG_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2.5 px-3 py-2.5 bg-card border-[2px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] no-underline text-foreground text-[13px] font-semibold transition-[transform,box-shadow] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--frame)]'
                >
                  <span className='shrink-0 w-6 h-6 bg-[var(--color-brand-teal)] border-[2px] border-[var(--frame)] rounded-[6px] grid place-items-center text-[13px] font-extrabold'>
                    ∿
                  </span>
                  {t('changelog')}
                </a>
                <a
                  href={SUPPORT_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2.5 px-3 py-2.5 bg-card border-[2px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] no-underline text-foreground text-[13px] font-semibold transition-[transform,box-shadow] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--frame)]'
                >
                  <span className='shrink-0 w-6 h-6 bg-[var(--color-brand-orange)] text-white border-[2px] border-[var(--frame)] rounded-[6px] grid place-items-center text-[13px] font-extrabold'>
                    !
                  </span>
                  {t('support')}
                </a>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-center'>
            <div className='w-full max-w-[520px] rounded-[14px] overflow-hidden border-[4px] border-[var(--frame)] [box-shadow:10px_10px_0_var(--color-brand-orange),10px_10px_0_4px_var(--frame)]'>
              <div className='flex items-center gap-2 bg-[#1a1a1a] border-b-2 border-black/80 px-3.5 py-2.5'>
                <span className='w-3 h-3 rounded-full bg-[var(--color-brand-red)] border border-black/20' />
                <span className='w-3 h-3 rounded-full bg-[var(--color-brand-yellow)] border border-black/20' />
                <span className='w-3 h-3 rounded-full bg-[var(--color-brand-green)] border border-black/20' />
                <span className='ml-auto font-mono text-[11px] text-[#888] tracking-[0.06em]'>server.log — pty/0</span>
              </div>
              <div ref={terminalRef} className='overflow-y-auto max-h-[420px] bg-[#1a1a1a]'>
                <pre className='font-mono text-[13px] leading-[1.55] text-[#ccc] p-[18px_20px_22px] whitespace-pre-wrap break-words m-0'>
                  {traceLines.slice(0, visibleCount).map((line, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static list
                    <TerminalLine key={i} line={line} />
                  ))}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
