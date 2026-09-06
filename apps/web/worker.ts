import { instrument } from "@microlabs/otel-cf-workers";
import handler from "./.open-next/worker.js";
import { tracingConfig } from "./src/infrastructure/clients/logging/better-stack/tracing";

export default instrument(handler, tracingConfig);
