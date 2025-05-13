export const Footer = () => (
	<footer className="mt-8 text-center text-sm text-muted-foreground">
		<div className="mb-2 flex flex-wrap justify-center gap-4">
			<div className="flex items-center">
				<div className="mr-2 h-4 w-4 rounded-sm border border-gray-300 bg-gray-500 dark:bg-gray-500 dark:border-gray-400" />
				<span>Hoy</span>
			</div>
			<div className="flex items-center">
				<div className="mr-2 h-4 w-4 rounded-sm border border-gray-300 bg-gray-200 dark:bg-gray-900 dark:border-gray-700" />
				<span>Fines de semana</span>
			</div>
			<div className="flex items-center">
				<div className="mr-2 h-4 w-4 rounded-sm border border-yellow-400 bg-yellow-300 dark:bg-yellow-400 dark:border-yellow-800" />
				<span>Festivos</span>
			</div>
			<div className="flex items-center">
				<div className="mr-2 h-4 w-4 rounded-sm border border-green-400 bg-green-300 dark:bg-green-500 dark:border-green-800" />
				<span>Días sugeridos</span>
			</div>
			<div className="flex items-center">
				<div className="mr-2 h-4 w-4 rounded-sm border border-purple-400 bg-purple-300 dark:bg-purple-900" />
				<span>Alternativas similares</span>
			</div>
		</div>
		<p>
			Los fines de semana y festivos ya están preseleccionados. Haz clic en cualquier día laborable para añadirlo como
			día PTO.
		</p>
		<p>
			Limitations: las sugerencias se basan en los bloques de dias (si se hace hover sobre un grupo de 3 dias sugeridos
			se buscaran alternativas que, con 3 dias de PTO, generen los mismos dias festivos)
		</p>
	</footer>
);
