import type { ReactNode } from 'react';

interface DemoProps {
  children: ReactNode;
  /** Extra utility classes for the demo canvas (e.g. flex direction, gap). */
  className?: string;
}

/**
 * Frame for live component demos: renders children on the app's real page
 * background so tokens, shadows and dark mode look exactly like production.
 */
export const Demo = ({ children, className }: DemoProps) => {
  return (
    <div
      className={`not-content bg-background text-foreground border-[3px] border-[var(--frame)] rounded-[14px] p-8 my-4 flex flex-wrap items-center gap-4 ${className ?? ''}`}
      style={{ backgroundImage: 'var(--page-glow)' }}
    >
      {children}
    </div>
  );
};
