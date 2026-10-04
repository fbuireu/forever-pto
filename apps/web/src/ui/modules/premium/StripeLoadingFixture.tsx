import { Bone } from "@ui/modules/core/primitives/Bone";

export const StripeLoadingFixture = () => (
	<div className="space-y-4" aria-busy="true">
		<Bone className="h-9 w-24" />
		<Bone className="h-48 w-full" />
	</div>
);
