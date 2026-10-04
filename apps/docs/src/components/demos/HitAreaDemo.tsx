import { Button } from "@ui/modules/core/primitives/Button";
import { Demo } from "../Demo";

const UNSTABLE_CLASSES =
	"inline-flex h-11 cursor-pointer items-center justify-center rounded-[8px] border-[3px] border-[var(--frame)] bg-primary px-5 text-sm font-black text-primary-foreground shadow-[var(--shadow-brutal-btn)] transition-[box-shadow,transform] duration-75 ease-linear hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-btn-hover)]";

export const HitAreaDemo = () => (
	<Demo>
		<Button>Stable (real Button)</Button>
		<button type="button" className={UNSTABLE_CLASSES}>
			Unstable (utility removed)
		</button>
	</Demo>
);
