import type { SimpleIcon } from "simple-icons";

interface IconProps {
	icon: SimpleIcon;
	size?: number;
	className?: string;
}

export const Icon = ({ icon, size = 24, className = "" }: IconProps) => (
	<svg role="img" viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
		<title>{icon.title}</title>
		<path d={icon.path} />
	</svg>
);
