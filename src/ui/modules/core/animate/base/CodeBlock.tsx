'use client';

import { type UseIsInViewOptions, useIsInView } from '@ui/hooks/useIsInView';
import { type ComponentProps, type Ref, type RefObject, useEffect, useState } from 'react';

type CodeBlockProps = ComponentProps<'div'> & {
  code: string;
  lang: string;
  theme?: 'light' | 'dark';
  themes?: { light: string; dark: string };
  writing?: boolean;
  duration?: number;
  delay?: number;
  onDone?: () => void;
  onWrite?: (info: { index: number; length: number; done: boolean }) => void;
  scrollContainerRef?: RefObject<HTMLElement | null>;
} & UseIsInViewOptions;

function CodeBlock({
  ref,
  code,
  lang,
  theme = 'light',
  themes = {
    light: 'github-light',
    dark: 'github-dark',
  },
  writing = false,
  duration = 5000,
  delay = 0,
  onDone,
  onWrite,
  scrollContainerRef,
  inView = false,
  inViewOnce = true,
  inViewMargin = '0px',
  ...props
}: CodeBlockProps) {
  const { ref: localRef, isInView } = useIsInView(ref as Ref<HTMLDivElement>, {
    inView,
    inViewOnce,
    inViewMargin,
  });

  const [visibleCode, setVisibleCode] = useState('');
  const [highlightedCode, setHighlightedCode] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!visibleCode.length || !isInView) return;

    const loadHighlightedCode = async () => {
      try {
        const { codeToHtml } = await import('shiki');
        const highlighted = await codeToHtml(visibleCode, {
          lang,
          themes,
          defaultColor: theme,
        });
        setHighlightedCode(highlighted);
      } catch (e) {
        console.error(`Language "${lang}" could not be loaded.`, e);
      }
    };

    loadHighlightedCode();
  }, [lang, themes, isInView, visibleCode, theme]);

  useEffect(() => {
    if (!writing) {
      setVisibleCode(code);
      onDone?.();
      onWrite?.({ index: code.length, length: code.length, done: true });
      return;
    }

    if (!code.length || !isInView) return;

    const characters = Array.from(code);
    let index = 0;
    const interval = duration / characters.length;
    let intervalId: ReturnType<typeof setInterval>;

    const timeout = setTimeout(() => {
      intervalId = setInterval(() => {
        if (index < characters.length) {
          setVisibleCode(() => {
            const nextChar = characters.slice(0, index + 1).join('');
            onWrite?.({ index: index + 1, length: characters.length, done: false });
            index += 1;
            return nextChar;
          });

          localRef.current?.scrollTo({ top: localRef.current.scrollHeight, behavior: 'smooth' });
        } else {
          clearInterval(intervalId);
          setIsDone(true);
          onDone?.();
          onWrite?.({ index: characters.length, length: characters.length, done: true });
        }
      }, interval);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalId);
    };
  }, [code, duration, delay, isInView, writing, onDone, onWrite, localRef]);

  useEffect(() => {
    if (!writing || !isInView) return;

    const el =
      scrollContainerRef?.current ??
      (localRef.current?.parentElement as HTMLElement | null) ??
      (localRef.current as unknown as HTMLElement | null);

    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [writing, isInView, scrollContainerRef, localRef]);

  return (
    <div
      ref={localRef}
      data-slot='code-block'
      data-writing={writing}
      data-done={isDone}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is sanitized HTML generated from code strings, not user input
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
      {...props}
    />
  );
}

export { CodeBlock, type CodeBlockProps };
