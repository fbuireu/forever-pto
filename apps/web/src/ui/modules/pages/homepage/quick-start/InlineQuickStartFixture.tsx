import { Bone } from "@ui/modules/core/primitives/Bone";

const YEAR_KEYS = ["previous", "current", "next", "after-next"];

export const InlineQuickStartFixture = () => (
	<div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
		<div className="space-y-2">
			<Bone className="h-3.5 w-16" />
			<Bone className="h-[52px] w-full" />
		</div>
		<div className="space-y-2">
			<Bone className="h-3.5 w-20" />
			<Bone className="h-[52px] w-[172px]" />
		</div>
		<div className="space-y-2">
			<Bone className="h-3.5 w-10" />
			<div className="grid grid-cols-4 gap-2 md:flex md:h-[52px] md:items-center">
				{YEAR_KEYS.map((key) => (
					<Bone key={key} className="h-9 md:w-[68px]" />
				))}
			</div>
		</div>
		<Bone className="h-[52px] w-full lg:w-[188px]" />
	</div>
);
