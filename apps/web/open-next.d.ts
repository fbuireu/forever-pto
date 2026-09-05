declare module "*/.open-next/worker.js" {
	const handler: {
		fetch: (
			request: Request,
			env: unknown,
			ctx: { waitUntil: (promise: Promise<unknown>) => void; passThroughOnException: () => void },
		) => Promise<Response>;
	};
	export default handler;
}
