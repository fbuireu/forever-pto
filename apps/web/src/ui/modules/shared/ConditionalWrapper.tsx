import type { ReactNode } from "react";

interface ConditionalWrapperProps {
	doWrap: boolean;
	wrapper: (children: ReactNode) => ReactNode;
	children: ReactNode;
}

export function ConditionalWrapper({ doWrap, wrapper, children }: Readonly<ConditionalWrapperProps>) {
	if (!doWrap) return <>{children}</>;

	return <>{wrapper(children)}</>;
}
