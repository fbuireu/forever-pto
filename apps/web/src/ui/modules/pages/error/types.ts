export interface ErrorBoundaryProps {
	readonly error: Error & { digest?: string };
	readonly reset: () => void;
}
