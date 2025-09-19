import type { SimpleIcon } from 'simple-icons';
import { getViewBoxFromSvg } from './utils/helpers';

interface IconProps {
  icon: SimpleIcon;
  size?: number;
  className?: string;
}

export const Icon = ({ icon, size = 24, className = '' }: IconProps) => {
  const viewBox = getViewBoxFromSvg(icon.svg);

  return (
    <svg role='img' viewBox={viewBox} width={size} height={size} className={className} fill='currentColor'>
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
};
