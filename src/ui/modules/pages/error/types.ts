export type ErrorBoundaryProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;
