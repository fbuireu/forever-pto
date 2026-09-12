import { LazyMotionProvider } from "@ui/modules/core/animate/providers/LazyMotionProvider";
import type { ReactNode } from "react";
import { DemoIntlProvider } from "./DemoIntlProvider";

interface DemoProps {
	children: ReactNode;
	/** Extra utility classes for the demo canvas (e.g. flex direction, gap). */
	className?: string;
}

/**
 * Frame for live component demos: renders children on the app's real page
 * background so tokens, shadows and dark mode look exactly like production,
 * and supplies the two app contexts a real component may reach for. A demo
 * that needs one must not have to remember it; see apps/docs/CLAUDE.md. The chip sits outside the
 * `data-demo` frame on purpose: e2e/demos.spec.ts counts that frame's children, and a chip inside it
 * would let a demo that renders nothing pass as rendered.
 */
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
