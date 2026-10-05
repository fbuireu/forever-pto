import { Strategy } from "@domain/calendar/types";
import { Users } from "@ui/modules/core/animate/icons/Users";
import { Plane, Scale, TrendingUp } from "lucide-react";
import type { ElementType } from "react";

export const STRATEGY_ICONS = {
	[Strategy.GROUPED]: Users,
	[Strategy.OPTIMIZED]: TrendingUp,
	[Strategy.BALANCED]: Scale,
	[Strategy.MAIN_VACATION]: Plane,
} as const satisfies Record<Strategy, ElementType>;
