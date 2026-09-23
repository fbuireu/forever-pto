"use client";

import { type DonateSource, useUIStore } from "@application/stores/ui";
import { Button } from "@ui/modules/core/primitives/Button";

interface SupportButtonProps {
	label: string;
	source: DonateSource;
	className?: string;
}

export function SupportButton({ label, source, className }: Readonly<SupportButtonProps>) {
	const openDonatePopover = useUIStore((s) => s.openDonatePopover);

	return (
		<Button className={className} variant="outline" onClick={() => openDonatePopover(source)}>
			{label}
		</Button>
	);
}
