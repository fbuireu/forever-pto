import { cn } from '@ui/utils/utils';

type PTOLogoProps = {
  size?: number;
  className?: string;
};

export function PTOLogo({ size = 64, className }: Readonly<PTOLogoProps>) {
  return (
    <div
      className={cn('relative bg-[#ffd93d] border-[3px] border-black rounded-[8px] overflow-hidden shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox='0 0 512 512' width={size} height={size} aria-hidden='true'>
        <defs>
          <linearGradient id='pto-sun-grad' x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor='#ff7a45' />
            <stop offset='100%' stopColor='#ffd93d' />
          </linearGradient>
        </defs>
        <g transform='rotate(-4 256 256)'>
          <g transform='translate(240 150)'>
            <rect x='0' y='60' width='18' height='90' rx='6' fill='black' />
            <path d='M9 0 C-20 10 -25 40 9 45 C43 40 38 10 9 0z' fill='#a6e368' />
            <path d='M9 20 C-25 30 -30 60 9 65 C48 60 43 30 9 20z' fill='#a6e368' />
          </g>
          <g transform='translate(340 200)'>
            <path d='M0 40 A40 40 0 1 1 80 40' fill='url(#pto-sun-grad)' />
            <rect x='0' y='50' width='80' height='6' fill='url(#pto-sun-grad)' />
            <rect x='0' y='65' width='80' height='6' fill='url(#pto-sun-grad)' />
            <rect x='0' y='80' width='80' height='6' fill='url(#pto-sun-grad)' />
          </g>
        </g>
      </svg>
    </div>
  );
}
