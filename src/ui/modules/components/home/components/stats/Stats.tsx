import { getBadgeVariant } from '@modules/components/home/components/stats/utils/getBadgeVariant';
import { Badge } from '@ui/modules/components/core/badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/modules/components/core/card/Card';
import { Separator } from '@ui/modules/components/core/separator/Separator';

interface StatsProps {
	stats: {
		country?: string;
		region?: string;
		nationalHolidays: number;
		regionalHolidays: number;
		totalHolidays: number;
		ptoDaysAvailable: number;
		ptoDaysUsed: number;
		effectiveDays: number;
		effectiveRatio: string;
	};
}

export const Stats = ({ stats }: StatsProps) => {
	if (!stats) {
		return null;
	}

	return (
		<Card className="w-full max-w-4xl mb-6">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg">Optimización de Vacaciones</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-sm text-slate-700 dark:text-slate-300">
					<h3 className="font-medium text-base mb-2">Resumen de días festivos</h3>
					<p>
						{stats.country ? `En ${stats.country} hay ` : "Hay "}
						<span className="font-medium">{stats.nationalHolidays} festivos nacionales</span>
						{stats.regionalHolidays > 0 && (
							<>
								{". Sumados a los "}
								<span className="font-medium">
									{stats.regionalHolidays} festivos de la {stats.region ? `región ${stats.region}` : "región"}
								</span>
							</>
						)}
						{", hacen un total de "}
						<span className="font-medium">{stats.totalHolidays} días festivos</span>.
					</p>
				</div>

				{stats.ptoDaysAvailable > 0 && (
					<>
						<Separator />
						<div className="text-sm text-slate-700 dark:text-slate-300">
							<h3 className="font-medium text-base mb-3">Efectividad de tus días PTO</h3>
							{stats.ptoDaysUsed > 0 ? (
								<>
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
										<div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
											<p className="text-xs text-slate-500 dark:text-slate-400">Días PTO utilizados</p>
											<p className="text-2xl font-bold">{stats.ptoDaysUsed}</p>
										</div>
										<div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
											<p className="text-xs text-slate-500 dark:text-slate-400">Días libres totales</p>
											<p className="text-2xl font-bold">{stats.effectiveDays}</p>
										</div>
										<div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg flex flex-col items-start">
											<p className="text-xs text-slate-500 dark:text-slate-400">Ratio de efectividad</p>
											<Badge
												variant={getBadgeVariant(stats.effectiveRatio)}
												className="mt-1 text-xl py-1 px-3 h-auto font-bold"
											>
												x{stats.effectiveRatio}
											</Badge>
										</div>
									</div>
									<p>
										Tienes <span className="font-medium">{stats.ptoDaysAvailable} días de PTO disponibles</span> que se
										han convertido en <span className="font-medium">{stats.effectiveDays} días libres</span> usando
										nuestro sistema, lo que supone un incremento de{" "}
										<Badge variant={getBadgeVariant(stats.effectiveRatio)} className="font-medium">
											x{stats.effectiveRatio}
										</Badge>{" "}
										de efectividad.
									</p>
								</>
							) : (
								<p>
									Tienes <span className="font-medium">{stats.ptoDaysAvailable} días de PTO disponibles</span>. El
									sistema está calculando los huecos óptimos para maximizar tus vacaciones.
								</p>
							)}
						</div>
					</>
				)}

				{stats.ptoDaysAvailable === 0 && (
					<>
						<Separator />
						<div className="text-sm text-slate-700 dark:text-slate-300">
							<p className="italic">
								Debes establecer la cantidad de días PTO disponibles para que el sistema pueda sugerir los días óptimos
								para maximizar tus vacaciones.
							</p>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
};
