import { FilterStrategy } from "@domain/calendar/types";
import { Users } from "@ui/modules/core/animate/icons/Users";
import { Plane, Scale, TrendingUp } from "lucide-react";
import type { ElementType } from "react";

export const STRATEGY_ICONS = {
	[FilterStrategy.GROUPED]: Users,
	[FilterStrategy.OPTIMIZED]: TrendingUp,
	[FilterStrategy.BALANCED]: Scale,
	[FilterStrategy.MAIN_VACATION]: Plane,
} as const satisfies Record<FilterStrategy, ElementType>;
