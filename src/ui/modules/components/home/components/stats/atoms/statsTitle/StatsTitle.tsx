interface StatsTitleProps {
	title: string;
	message: string;
}

export const StatsTitle = ({ title, message }: StatsTitleProps) => (
	<div className="text-sm text-slate-700 dark:text-slate-300">
		<h3 className="font-medium text-base mb-2">{title}</h3>
		<p>{message}</p>
	</div>
);
