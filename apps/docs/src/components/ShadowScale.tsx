interface ShadowScaleProps {
  /** Shadow token names, e.g. ['--shadow-brutal-xs', '--shadow-brutal-sm'] */
  tokens: string[];
}

/**
 * Renders boxes carrying each brutal shadow token, read live from the app
 * stylesheets so the documentation cannot drift from the real values.
 */
export const ShadowScale = ({ tokens }: ShadowScaleProps) => {
  return (
    <div className='not-content flex flex-wrap gap-8 my-6 p-6 bg-background rounded-[14px] border-[3px] border-[var(--frame)]'>
      {tokens.map((token) => (
        <div key={token} className='flex flex-col items-center gap-3'>
          <div
            className='size-20 bg-[var(--surface-panel)] border-[3px] border-[var(--frame)] rounded-[8px]'
            style={{ boxShadow: `var(${token})` }}
          />
          <code className='text-[11px]'>{token}</code>
        </div>
      ))}
    </div>
  );
};
