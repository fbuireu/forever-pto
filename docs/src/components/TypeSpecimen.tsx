const SPECIMENS = [
  { token: '--font-display', label: 'Display — Bricolage Grotesque', sample: 'Take every day off you deserve' },
  { token: '--font-sans', label: 'Body — Space Grotesk', sample: 'Combine PTO days with public holidays.' },
  { token: '--font-serif', label: 'Serif — Instrument Serif', sample: 'Forever is a long time…', italic: true },
  { token: '--font-mono', label: 'Mono — JetBrains Mono', sample: 'strategy: "optimized"' },
] as const;

/**
 * Live type specimens using the same font tokens the app maps in
 * src/ui/styles/theme/index.css.
 */
export const TypeSpecimen = () => {
  return (
    <div className='not-content flex flex-col gap-5 my-6 p-6 bg-background rounded-[14px] border-[3px] border-[var(--frame)]'>
      {SPECIMENS.map(({ token, label, sample, ...rest }) => (
        <div key={token}>
          <code className='text-[11px] text-[var(--muted-foreground)]'>
            {token} · {label}
          </code>
          <p
            className='text-2xl mt-1'
            style={{
              fontFamily: `var(${token})`,
              fontStyle: 'italic' in rest && rest.italic ? 'italic' : 'normal',
              fontWeight: token === '--font-display' ? 800 : 500,
            }}
          >
            {sample}
          </p>
        </div>
      ))}
    </div>
  );
};
