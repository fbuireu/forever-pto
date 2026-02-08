const CHARS = [
  { character: 'B', order: 7 }, { character: 'r', order: 3 }, { character: 'e', order: 11 },
  { character: 'F', order: 0 }, { character: 'n', order: 5 }, { character: 'i', order: 9 },
  { character: 'r', order: 2 }, { character: 'u', order: 12 }, { character: '\u00A0', order: 6 },
  { character: 'e', order: 1 }, { character: 'u', order: 8 }, { character: 'a', order: 4 },
  { character: 'r', order: 10 },
];

interface MeProps {
  ariaLabel: string;
}

export const Me = ({ ariaLabel }: MeProps) => {
  return (
    <span className="inline-flex select-none" role="img" aria-label={ariaLabel}>
      {CHARS.map(({ character, order }, i) => (
        <span key={character + i} style={{ order }}>{character}</span>
      ))}
    </span>
  );
};
