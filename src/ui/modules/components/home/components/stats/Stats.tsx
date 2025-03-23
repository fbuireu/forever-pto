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
		<div className="w-full max-w-4xl p-4 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-sm mb-6">
			<div className="space-y-4">
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
					<div className="text-sm text-slate-700 dark:text-slate-300 border-t pt-4 border-slate-200 dark:border-slate-700">
						<h3 className="font-medium text-base mb-2">Efectividad de tus días PTO</h3>
						{stats.ptoDaysUsed > 0 ? (
							<>
								<div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-4">
									<div>
										<p className="text-sm text-slate-500 dark:text-slate-400">Días PTO utilizados</p>
										<p className="text-xl font-bold">{stats.ptoDaysUsed}</p>
									</div>
									<div>
										<p className="text-sm text-slate-500 dark:text-slate-400">Días libres totales</p>
										<p className="text-xl font-bold">{stats.effectiveDays}</p>
									</div>
									<div>
										<p className="text-sm text-slate-500 dark:text-slate-400">Ratio de efectividad</p>
										<p className="text-xl font-bold text-primary">x{stats.effectiveRatio}</p>
									</div>
								</div>
								<p>
									Tienes <span className="font-medium">{stats.ptoDaysAvailable} días de PTO disponibles</span>{" "}
									{stats.ptoDaysUsed > 0 ? (
										<>
											que se han convertido en <span className="font-medium">{stats.effectiveDays} días libres</span>{" "}
											usando nuestro sistema, lo que supone un incremento de{" "}
											<span className="font-medium text-primary">x{stats.effectiveRatio}</span> de efectividad.
										</>
									) : (
										"para optimizar tus vacaciones."
									)}
								</p>
							</>
						) : (
							<p>
								Tienes <span className="font-medium">{stats.ptoDaysAvailable} días de PTO disponibles</span>. El sistema
								está calculando los huecos óptimos para maximizar tus vacaciones.
							</p>
						)}
					</div>
				)}

				{stats.ptoDaysAvailable === 0 && (
					<div className="text-sm text-slate-700 dark:text-slate-300 border-t pt-4 border-slate-200 dark:border-slate-700">
						<p className="italic">
							Debes establecer la cantidad de días PTO disponibles para que el sistema pueda sugerir los días óptimos
							para maximizar tus vacaciones.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
