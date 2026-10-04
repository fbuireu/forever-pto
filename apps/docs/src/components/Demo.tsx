import { LazyMotionProvider } from "@ui/modules/core/animate/providers/LazyMotionProvider";
import type { ReactNode } from "react";
import { DemoIntlProvider } from "./DemoIntlProvider";

interface DemoProps {
	children: ReactNode;
	className?: string;
}

export const Demo = ({ children, className }: DemoProps) => {
	return (
		<LazyMotionProvider>
			<DemoIntlProvider>
				<div className="demo-frame not-content my-4">
					<span className="demo-chip" aria-hidden="true">
						Live · apps/web
					</span>
					<div
						data-demo
						className={`not-content bg-background text-foreground border-[3px] border-[var(--frame)] rounded-[14px] p-8 flex flex-wrap items-center gap-4 ${className ?? ""}`}
						style={{ backgroundImage: "var(--page-glow)" }}
					>
						{children}
					</div>
				</div>
			</DemoIntlProvider>
		</LazyMotionProvider>
	);
};
