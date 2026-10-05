type StoredRecord = Record<string, unknown>;

const isStoredRecord = (value: unknown): value is StoredRecord =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const migratePlan = (plan: unknown): unknown => {
	if (!isStoredRecord(plan) || !isStoredRecord(plan.metrics) || !("firstLastBreak" in plan.metrics)) return plan;

	const { firstLastBreak, ...metrics } = plan.metrics;

	return { ...plan, metrics: { ...metrics, firstLastRestBlock: firstLastBreak } };
};

interface MigrateHolidaysParams {
	persisted: unknown;
	version: number;
}

const migratePlans = (plans: unknown): unknown => (Array.isArray(plans) ? plans.map(migratePlan) : plans);

export const migrateHolidays = ({ persisted, version }: MigrateHolidaysParams): unknown => {
	if (version < 1) return {};
	if (version >= 2 || !isStoredRecord(persisted)) return persisted;

	const { manuallySelectedDays, ...rest } = persisted;

	return {
		...rest,
		...("manuallySelectedDays" in persisted && { manualDays: manuallySelectedDays }),
		...("suggestion" in persisted && { suggestion: migratePlan(persisted.suggestion) }),
		...("alternatives" in persisted && { alternatives: migratePlans(persisted.alternatives) }),
		...("currentSelection" in persisted && { currentSelection: migratePlan(persisted.currentSelection) }),
	};
};
