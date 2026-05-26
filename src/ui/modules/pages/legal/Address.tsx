const CHARS = [
  { character: ',', order: 23 },
  { character: 'r', order: 5 },
  { character: ',', order: 41 },
  { character: 'o', order: 15 },
  { character: ',', order: 30 },
  { character: 'd', order: 7 },
  { character: 'p', order: 44 },
  { character: '3', order: 17 },
  { character: 'o', order: 38 },
  { character: 'a', order: 1 },
  { character: 'n', order: 47 },
  { character: 'r', order: 12 },
  { character: '0', order: 25 },
  { character: 'c', order: 35 },
  { character: ' ', order: 9 },
  { character: ' ', order: 20 },
  { character: 'r', order: 3 },
  { character: 'i', order: 46 },
  { character: '2', order: 28 },
  { character: 'o', order: 11 },
  { character: 'a', order: 40 },
  { character: 'e', order: 13 },
  { character: ' ', order: 31 },
  { character: ' ', order: 6 },
  { character: ' ', order: 42 },
  { character: 'B', order: 22 },
  { character: 'r', order: 34 },
  { character: ' ', order: 16 },
  { character: 'S', order: 43 },
  { character: 'C', order: 0 },
  { character: 'e', order: 36 },
  { character: ',', order: 19 },
  { character: 'L', order: 10 },
  { character: '9', order: 29 },
  { character: 'r', order: 2 },
  { character: 'a', order: 45 },
  { character: ' ', order: 24 },
  { character: 'B', order: 32 },
  { character: 't', order: 14 },
  { character: '8', order: 26 },
  { character: 'e', order: 4 },
  { character: 'n', order: 39 },
  { character: '6', order: 18 },
  { character: 'e', order: 8 },
  { character: 'a', order: 33 },
  { character: '5', order: 21 },
  { character: 'l', order: 37 },
  { character: '0', order: 27 },
];

interface AddressProps {
  ariaLabel: string;
}

export const Address = ({ ariaLabel }: AddressProps) => {
  return (
    <span className='inline-flex select-none' role='img' aria-label={ariaLabel}>
      {CHARS.map(({ character, order }) => (
        <span key={order} style={{ order }}>
          {character}
        </span>
      ))}
    </span>
  );
};
