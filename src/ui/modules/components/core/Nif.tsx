const CHARS = [
  { character: '2', order: 5 }, { character: 'H', order: 8 }, { character: '9', order: 2 },
  { character: '4', order: 0 }, { character: '7', order: 7 }, { character: '7', order: 3 },
  { character: '6', order: 1 }, { character: '9', order: 6 }, { character: '2', order: 4 },
];

interface NifProps {
  ariaLabel: string;
}

export const Nif = ({ ariaLabel }: NifProps) => {
  return (
    <span className="inline-flex select-none" role="img" aria-label={ariaLabel}>
      {CHARS.map(({ character, order }, i) => (
        <span key={character + i} style={{ order }}>{character}</span>
      ))}
    </span>
  );
};
