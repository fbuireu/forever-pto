import { Badge } from "@ui/modules/core/primitives/Badge";
import { Button } from "@ui/modules/core/primitives/Button";
import { Demo } from "../Demo";

const SURFACE_TOKENS = ["--surface-panel", "--surface-panel-alt", "--surface-panel-soft"] as const;

export const DarkModeDemo = () => (
	<Demo>
		<Button>Primary</Button>
		<Button variant="accent">Accent</Button>
		<Button variant="outline">Outline</Button>
		<Badge variant="outline">Badge</Badge>
		{SURFACE_TOKENS.map((token) => (
			<span
				key={token}
				className="rounded-[8px] border-[3px] border-[var(--frame)] px-3 py-2"
				style={{ background: `var(${token})` }}
			>
				<code className="text-[11px]">{token}</code>
			</span>
		))}
	</Demo>
);
