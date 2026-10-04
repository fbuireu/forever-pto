interface ShadowScaleProps {
	tokens: string[];
}

export const ShadowScale = ({ tokens }: ShadowScaleProps) => {
	return (
		<div className="not-content flex flex-wrap gap-8 my-6 p-6 bg-background rounded-[14px] border-[3px] border-[var(--frame)]">
			{tokens.map((token) => (
				<div key={token} className="flex flex-col items-center gap-3">
					<div
						className="size-20 bg-[var(--surface-panel)] border-[3px] border-[var(--frame)] rounded-[8px]"
						style={{ boxShadow: `var(${token})` }}
					/>
					<code className="text-[11px]">{token}</code>
				</div>
			))}
		</div>
	);
};
