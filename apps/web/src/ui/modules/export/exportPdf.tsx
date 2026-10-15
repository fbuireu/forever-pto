import { type Cause, Effect, type Scope } from "effect";
import type { HolidayDocumentProps } from "./HolidayDocument";

export interface ExportPdfParams extends HolidayDocumentProps {
	filename: string;
}

const makeObjectUrl = (blob: Blob): Effect.Effect<string, never, Scope.Scope> =>
	Effect.acquireRelease(
		Effect.sync(() => URL.createObjectURL(blob)),
		(url) => Effect.sync(() => URL.revokeObjectURL(url)),
	);

const pdfExportEffect = ({ filename, ...docProps }: ExportPdfParams): Effect.Effect<void, Cause.UnknownException> =>
	Effect.gen(function* () {
		const [renderer, { HolidayDocument }] = yield* Effect.tryPromise(() =>
			Promise.all([import("@react-pdf/renderer"), import("./HolidayDocument")]),
		);
		const blob = yield* Effect.tryPromise(() => renderer.pdf(<HolidayDocument {...docProps} />).toBlob());
		const url = yield* makeObjectUrl(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
	}).pipe(Effect.scoped);

export const exportPdf = (params: ExportPdfParams): Promise<void> => Effect.runPromise(pdfExportEffect(params));
