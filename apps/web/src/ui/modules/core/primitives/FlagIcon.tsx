import { cn } from '@ui/utils/cn';

interface FlagIconProps {
  code: string;
  className?: string;
}

export function FlagIcon({ code, className }: Readonly<FlagIconProps>) {
  if (!code) return null;

  return (
    <span
      className={cn('fi', `fi-${code}`, 'rounded-sm overflow-hidden shrink-0 inline-block', className)}
      aria-hidden='true'
    />
  );
}
