interface TokenSwatchProps {
  /** CSS custom property names, e.g. ['--color-brand-yellow', '--accent'] */
  tokens: string[];
}

/**
 * Color swatches that read the CSS variables at render time, so the values
 * shown always match the imported app stylesheets (light and dark).
 */
export const TokenSwatch = ({ tokens }: TokenSwatchProps) => {
  return (
    <div className='not-content grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 my-4'>
      {tokens.map((token) => (
        <div
          key={token}
          className='border-[3px] border-[var(--frame)] rounded-[8px] overflow-hidden bg-[var(--surface-panel)]'
        >
          <div className='h-14' style={{ background: `var(${token})` }} />
          <code className='block px-2 py-1.5 text-[11px] leading-tight'>{token}</code>
        </div>
      ))}
    </div>
  );
};
